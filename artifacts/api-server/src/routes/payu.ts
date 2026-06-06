import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { paymentsTable, casesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const PAYU_KEY = process.env.PAYU_KEY!;
const PAYU_SALT = process.env.PAYU_SALT!;

// PayU test URL: https://test.payu.in/_payment
// PayU live URL: https://secure.payu.in/_payment
const PAYU_URL =
  process.env.NODE_ENV === "production"
    ? "https://secure.payu.in/_payment"
    : "https://test.payu.in/_payment";

function sha512(str: string) {
  return crypto.createHash("sha512").update(str).digest("hex");
}

// PayU hash: sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)
function generateHash(params: {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
}) {
  const hashStr = `${PAYU_KEY}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|||||||||||${PAYU_SALT}`;
  return sha512(hashStr);
}

// Verify PayU response hash: sha512(salt|status||||||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
function verifyHash(body: Record<string, string>) {
  const hashStr = `${PAYU_SALT}|${body.status}||||||||||${body.udf5 || ""}|${body.udf4 || ""}|${body.udf3 || ""}|${body.udf2 || ""}|${body.udf1 || ""}|${body.email}|${body.firstname}|${body.productinfo}|${body.amount}|${body.txnid}|${PAYU_KEY}`;
  return sha512(hashStr) === body.hash;
}

function getBaseUrl(req: import("express").Request) {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host")}`;
}

// POST /payu/initiate — create a PayU transaction for a payment record
router.post("/payu/initiate", async (req, res): Promise<void> => {
  const { paymentId } = req.body as { paymentId?: number };
  if (!paymentId) { res.status(400).json({ error: "paymentId required" }); return; }

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId)).limit(1);
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  if (payment.paymentStatus === "PAID") { res.status(400).json({ error: "Already paid" }); return; }

  const [caseRow] = await db.select().from(casesTable).where(eq(casesTable.id, payment.caseId)).limit(1);
  const [user] = caseRow?.customerId
    ? await db.select().from(usersTable).where(eq(usersTable.id, caseRow.customerId)).limit(1)
    : [undefined];

  const pendingAmount = parseFloat(payment.pendingAmount as string);
  if (pendingAmount <= 0) { res.status(400).json({ error: "No pending amount" }); return; }

  const txnid = `CIR-${payment.id}-${Date.now()}`;
  const amount = pendingAmount.toFixed(2);
  const productinfo = `CIR Service: ${caseRow?.serviceType?.replace(/_/g, " ") || "Credit Report Rectification"}`;
  const firstname = user?.name?.split(" ")[0] || "Customer";
  const email = user?.email || "customer@circonsultationservice.site";
  const mobile = user?.mobile || "9999999999";
  const baseUrl = getBaseUrl(req);

  // Save txnid
  await db.update(paymentsTable).set({ payuTxnId: txnid }).where(eq(paymentsTable.id, paymentId));

  const hash = generateHash({ txnid, amount, productinfo, firstname, email });

  // Return all params so frontend can POST to PayU
  res.json({
    payuUrl: PAYU_URL,
    params: {
      key: PAYU_KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone: mobile,
      surl: `${baseUrl}/api/payu/callback`,
      furl: `${baseUrl}/api/payu/callback`,
      hash,
      service_provider: "payu_paisa",
    },
  });
});

// POST /payu/callback — PayU posts here after payment
router.post("/payu/callback", async (req, res): Promise<void> => {
  const body = req.body as Record<string, string>;

  // Verify hash
  if (!verifyHash(body)) {
    res.redirect("/dashboard/payments?payu=error&reason=hash_mismatch");
    return;
  }

  const { txnid, status, mihpayid } = body;

  // Find payment by txnid
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.payuTxnId, txnid))
    .limit(1);

  if (!payment) {
    res.redirect("/dashboard/payments?payu=error&reason=not_found");
    return;
  }

  if (status === "success") {
    const serviceFee = parseFloat(payment.serviceFee as string);
    const paid = parseFloat(payment.advancePaid as string) + parseFloat(body.amount);
    const pending = Math.max(0, serviceFee - paid);
    const paymentStatus = pending <= 0 ? "PAID" : "PARTIAL";

    await db
      .update(paymentsTable)
      .set({
        advancePaid: String(paid),
        pendingAmount: String(pending),
        paymentStatus,
        payuTxnId: mihpayid || txnid,
      })
      .where(eq(paymentsTable.id, payment.id));

    res.redirect(`/dashboard/payments?payu=success&txn=${mihpayid || txnid}`);
  } else {
    res.redirect(`/dashboard/payments?payu=failed&txn=${txnid}`);
  }
});

// GET /payu/status/:paymentId — check txn status
router.get("/payu/status/:paymentId", async (req, res): Promise<void> => {
  const id = parseInt(req.params.paymentId);
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id)).limit(1);
  if (!payment) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ paymentStatus: payment.paymentStatus, payuTxnId: payment.payuTxnId });
});

export default router;
