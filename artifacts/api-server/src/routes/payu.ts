import { Router } from "express";
import crypto from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { casesTable, db, paymentsTable, quoteSnapshotsTable, usersTable } from "@workspace/db";
import { getSessionUserId, isAdmin } from "../lib/auth";

const router = Router();
const PAYU_URL = process.env.NODE_ENV === "production" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";
const hash = (value: string) => crypto.createHash("sha512").update(value).digest("hex");
const merchantKey = () => process.env.PAYU_KEY;
const merchantSalt = () => process.env.PAYU_SALT;

function checkoutHash(p: { txnid: string; amount: string; productinfo: string; firstname: string; email: string }) {
  return hash(`${merchantKey()}|${p.txnid}|${p.amount}|${p.productinfo}|${p.firstname}|${p.email}|||||||||||${merchantSalt()}`);
}
function callbackHash(body: Record<string, string>) {
  // PayU prefixes the reverse hash with additionalCharges when it is present.
  const additionalCharges = body.additionalCharges ?? body.additional_charges;
  return hash(`${additionalCharges ? `${additionalCharges}|` : ""}${merchantSalt()}|${body.status}||||||||||${body.udf5 ?? ""}|${body.udf4 ?? ""}|${body.udf3 ?? ""}|${body.udf2 ?? ""}|${body.udf1 ?? ""}|${body.email}|${body.firstname}|${body.productinfo}|${body.amount}|${body.txnid}|${merchantKey()}`);
}
function baseUrl(req: import("express").Request) {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  return domain ? `https://${domain}` : `${req.protocol}://${req.get("host")}`;
}
async function userForRequest(req: import("express").Request) {
  const id = getSessionUserId(req);
  if (!id) return null;
  return (await db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, id)).limit(1))[0] ?? null;
}
function redirect(res: import("express").Response, state: string, txn?: string) {
  res.redirect(`/dashboard/payments?payu=${state}${txn ? `&txn=${encodeURIComponent(txn)}` : ""}`);
}

/** A quote checkout is the only flow permitted to turn a PayU success into a case. */
router.post("/quotes/:id/checkout", async (req, res): Promise<void> => {
  const user = await userForRequest(req);
  const quoteId = Number.parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!Number.isInteger(quoteId) || req.body?.accept !== true) { res.status(400).json({ error: "Explicit quote acceptance is required" }); return; }
  if (!merchantKey() || !merchantSalt()) { req.log.error("PayU credentials are not configured"); res.status(503).json({ error: "Checkout is temporarily unavailable" }); return; }

  const result = await db.transaction(async (tx) => {
    // Serialize accept/double-click requests before checking the one-payment-per-quote invariant.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${quoteId})`);
    const quote = (await tx.select().from(quoteSnapshotsTable).where(eq(quoteSnapshotsTable.id, quoteId)).limit(1))[0];
    if (!quote) return { error: "Quote not found", code: 404 };
    if (quote.customerId !== user.id && !isAdmin(user.role)) return { error: "Not authorized for this quote", code: 403 };
    // A quote must be based on an administrator approved report. This also prevents arbitrary snapshots.
    if (!quote.reportId) return { error: "Quote is not eligible for checkout", code: 400 };
    const existing = (await tx.select().from(paymentsTable).where(eq(paymentsTable.quoteSnapshotId, quote.id)).limit(1))[0];
    if (existing?.verificationStatus === "VERIFIED") return { error: "This quote has already been paid", code: 409 };
    const [accepted] = quote.acceptedAt
      ? [quote]
      : await tx.update(quoteSnapshotsTable).set({ acceptedAt: new Date(), acceptedById: user.id }).where(eq(quoteSnapshotsTable.id, quote.id)).returning();
    const customer = (await tx.select().from(usersTable).where(eq(usersTable.id, quote.customerId)).limit(1))[0];
    if (!customer) return { error: "Customer not found", code: 404 };
    // PENDING is an in-flight/abandoned checkout and must be idempotently resumable. A terminal
    // FAILED attempt receives a new merchant transaction, so its delayed callback cannot settle retry.
    const txnid = existing?.verificationStatus === "PENDING" && existing.payuTxnId
      ? existing.payuTxnId
      : `Q${quote.id}P${Date.now()}${crypto.randomBytes(4).toString("hex")}`;
    const firstname = customer.name.split(" ")[0] || "Customer";
    const productinfo = `CIR Quote ${accepted.id}`;
    const payment = existing
      ? (await tx.update(paymentsTable).set({ payuTxnId: txnid, payuAmount: accepted.total, verificationStatus: "PENDING", payuProductInfo: productinfo, payuFirstName: firstname, payuEmail: customer.email }).where(eq(paymentsTable.id, existing.id)).returning())[0]
      : (await tx.insert(paymentsTable).values({ quoteSnapshotId: accepted.id, serviceFee: accepted.total, pendingAmount: accepted.total, paymentSource: "QUOTE_PAYU", verificationStatus: "PENDING", payuTxnId: txnid, payuAmount: accepted.total, payuProductInfo: productinfo, payuFirstName: firstname, payuEmail: customer.email }).returning())[0];
    return { payment, quote: accepted, customer };
  });
  if ("error" in result) { res.status(result.code ?? 400).json({ error: result.error }); return; }
  const amount = Number(result.quote.total).toFixed(2);
  const firstname = result.payment.payuFirstName!;
  const email = result.payment.payuEmail!;
  const productinfo = result.payment.payuProductInfo!;
  res.json({ paymentId: result.payment.id, quoteId: result.quote.id, payuUrl: PAYU_URL, params: { key: merchantKey()!, txnid: result.payment.payuTxnId!, amount, productinfo, firstname, email, phone: result.customer.mobile || "", surl: `${baseUrl(req)}/api/payu/callback`, furl: `${baseUrl(req)}/api/payu/callback`, hash: checkoutHash({ txnid: result.payment.payuTxnId!, amount, productinfo, firstname, email }), service_provider: "payu_paisa" } });
});

// Legacy case-payment checkout remains available, but can never settle or create quote-derived cases.
router.post("/payu/initiate", async (req, res): Promise<void> => {
  const user = await userForRequest(req);
  const paymentId = Number(req.body?.paymentId);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!Number.isInteger(paymentId) || !merchantKey() || !merchantSalt()) { res.status(400).json({ error: "Valid payment and PayU configuration are required" }); return; }
  const payment = (await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId)).limit(1))[0];
  const caseRow = payment?.caseId ? (await db.select().from(casesTable).where(eq(casesTable.id, payment.caseId)).limit(1))[0] : null;
  if (!payment || !caseRow || payment.paymentSource === "QUOTE_PAYU" || (!isAdmin(user.role) && caseRow.customerId !== user.id)) { res.status(404).json({ error: "Payment not found" }); return; }
  if (payment.paymentStatus === "PAID" || Number(payment.pendingAmount) <= 0) { res.status(409).json({ error: "No pending amount" }); return; }
  const customer = (await db.select().from(usersTable).where(eq(usersTable.id, caseRow.customerId)).limit(1))[0];
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  const txnid = `L${payment.id}P${Date.now()}${crypto.randomBytes(4).toString("hex")}`;
  const amount = Number(payment.pendingAmount).toFixed(2);
  const firstname = customer.name.split(" ")[0] || "Customer";
  const productinfo = `CIR Case ${caseRow.id}`;
  await db.update(paymentsTable).set({ payuTxnId: txnid, payuAmount: amount, payuProductInfo: productinfo, payuFirstName: firstname, payuEmail: customer.email, verificationStatus: "PENDING" }).where(eq(paymentsTable.id, payment.id));
  res.json({ payuUrl: PAYU_URL, params: { key: merchantKey(), txnid, amount, productinfo, firstname, email: customer.email, phone: customer.mobile || "", surl: `${baseUrl(req)}/api/payu/callback`, furl: `${baseUrl(req)}/api/payu/callback`, hash: checkoutHash({ txnid, amount, productinfo, firstname, email: customer.email }), service_provider: "payu_paisa" } });
});

router.post("/payu/callback", async (req, res): Promise<void> => {
  const body = req.body as Record<string, string>;
  const expectedHash = merchantKey() && merchantSalt() && body.hash ? callbackHash(body) : "";
  if (!expectedHash || expectedHash.length !== body.hash.length || !crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(body.hash))) {
    req.log.warn("Rejected PayU callback with invalid hash");
    redirect(res, "error"); return;
  }
  const payment = (await db.select().from(paymentsTable).where(eq(paymentsTable.payuTxnId, body.txnid)).limit(1))[0];
  // Quote transactions require an exact server-generated identity and amount, not merely a valid PayU hash.
  if (!payment || payment.payuAmount == null || Number(payment.payuAmount).toFixed(2) !== Number(body.amount).toFixed(2) || body.productinfo !== payment.payuProductInfo || body.firstname !== payment.payuFirstName || body.email !== payment.payuEmail) {
    req.log.warn({ txnid: body.txnid }, "Rejected PayU callback with mismatched checkout fields");
    redirect(res, "error"); return;
  }
  if (body.status !== "success") {
    await db.update(paymentsTable).set({ verificationStatus: body.status === "pending" ? "PENDING" : "FAILED" }).where(and(eq(paymentsTable.id, payment.id), eq(paymentsTable.verificationStatus, "PENDING")));
    redirect(res, body.status === "pending" ? "pending" : "failed", body.txnid); return;
  }
  if (payment.paymentSource !== "QUOTE_PAYU") {
    // Legacy payments may be settled, but this branch intentionally has no case-creation behavior.
    await db.update(paymentsTable).set({ advancePaid: payment.serviceFee, pendingAmount: "0", paymentStatus: "PAID", verificationStatus: "VERIFIED", payuPaymentId: body.mihpayid || null, verifiedAt: new Date() }).where(eq(paymentsTable.id, payment.id));
    redirect(res, "success", body.mihpayid || body.txnid); return;
  }
  const outcome = await db.transaction(async (tx) => {
    // Serialize callbacks for this payment. The second callback waits, reloads, and sees the case
    // created by the first instead of racing into the unique index.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${payment.id})`);
    const current = (await tx.select().from(paymentsTable).where(eq(paymentsTable.id, payment.id)).limit(1))[0];
    if (!current || current.verificationStatus === "FAILED") return false;
    const alreadyCreated = (await tx.select().from(casesTable).where(eq(casesTable.quotePaymentId, current.id)).limit(1))[0];
    if (alreadyCreated) return true;
    const quote = current.quoteSnapshotId ? (await tx.select().from(quoteSnapshotsTable).where(eq(quoteSnapshotsTable.id, current.quoteSnapshotId)).limit(1))[0] : null;
    if (!quote || !quote.acceptedAt || quote.customerId <= 0) return false;
    await tx.update(paymentsTable).set({ advancePaid: current.serviceFee, pendingAmount: "0", paymentStatus: "PAID", verificationStatus: "VERIFIED", payuPaymentId: body.mihpayid || null, verifiedAt: new Date() }).where(eq(paymentsTable.id, current.id));
    const [caseRow] = await tx.insert(casesTable).values({ caseNumber: `CIR-${new Date().getFullYear()}-Q${current.id}`, customerId: quote.customerId, quotePaymentId: current.id, serviceType: "CREDIT_REPORT_RECTIFICATION" }).returning();
    await tx.update(paymentsTable).set({ caseId: caseRow.id }).where(eq(paymentsTable.id, current.id));
    return true;
  });
  redirect(res, outcome ? "success" : "error", body.mihpayid || body.txnid);
});

export default router;