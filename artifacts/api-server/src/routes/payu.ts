import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { paymentsTable, casesTable, usersTable, payuTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyPayuHash, recordPayuResult } from "../lib/payu";

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

function getBaseUrl(req: import("express").Request) {
  if (process.env.NODE_ENV === "production") {
    const url = process.env.PAYU_CALLBACK_BASE_URL;
    if (!url) throw new Error("PAYU_CALLBACK_BASE_URL is not configured");
    return new URL(url).origin;
  }
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host")}`;
}

// POST /payu/initiate — create a PayU transaction for a payment record
router.post("/payu/initiate", async (req, res): Promise<void> => {
  if (!PAYU_KEY || !PAYU_SALT) { res.status(503).json({ error: "Payment gateway is not configured" }); return; }
  const { paymentId } = req.body as { paymentId?: number };
  if (!Number.isSafeInteger(paymentId) || !paymentId || paymentId <= 0) { res.status(400).json({ error: "Valid paymentId required" }); return; }

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
  const email = user?.email || "customer@circonsultationservice.in";
  const mobile = user?.mobile || "9999999999";
  const baseUrl = getBaseUrl(req);

  // Persist each attempt, so a retry does not lose an earlier confirmation.
  await db.transaction(async tx => {
    await tx.insert(payuTransactionsTable).values({ txnid, paymentId, amount });
    await tx.update(paymentsTable).set({ payuTxnId: txnid }).where(eq(paymentsTable.id, paymentId));
  });

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
  const webhook = req.query.webhook === "1";
  if (!body || !verifyPayuHash(body, PAYU_KEY, PAYU_SALT)) {
    if (webhook) res.status(400).json({ error: "Invalid PayU confirmation" });
    else res.redirect(303, "/dashboard/payments?payu=error&reason=hash_mismatch");
    return;
  }
  try {
    const { result } = await recordPayuResult(body);
    if (webhook) {
      const statusCode = result === "not_found" ? 404 : result === "amount_mismatch" ? 400 : 200;
      res.status(statusCode).json({ result });
    } else {
      const outcome = result === "not_found" || result === "amount_mismatch" ? "error" : result;
      res.redirect(303, `/dashboard/payments?payu=${outcome}&txn=${encodeURIComponent(body.mihpayid || body.txnid)}`);
    }
  } catch {
    req.log.error("Could not save PayU confirmation; payment confirmation must be retried");
    if (webhook) res.status(503).json({ error: "Payment confirmation could not be saved. Retry required." });
    else res.redirect(303, "/dashboard/payments?payu=error&reason=save_failed");
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
