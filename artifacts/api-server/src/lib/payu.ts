import crypto from "node:crypto";
import { db, paymentsTable, payuTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function verifyPayuHash(body: Record<string, string>, key: string, salt: string) {
  if (!key || !salt || body.key !== key || !/^[a-f0-9]{128}$/i.test(body.hash || "")) return false;
  if (["status", "txnid", "amount", "productinfo", "firstname", "email"].some(field => typeof body[field] !== "string")) return false;
  // PayU's reverse hash has SIX separators between status and udf5.
  const extra = body.additionalCharges ?? body.additional_charges;
  const prefix = extra !== undefined && extra !== "" ? `${extra}|` : "";
  const split = body.splitInfo ? `${body.splitInfo}|` : "";
  const hashString = `${prefix}${salt}|${body.status}|${split}|||||${body.udf5 || ""}|${body.udf4 || ""}|${body.udf3 || ""}|${body.udf2 || ""}|${body.udf1 || ""}|${body.email}|${body.firstname}|${body.productinfo}|${body.amount}|${body.txnid}|${key}`;
  const expected = crypto.createHash("sha512").update(hashString).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(body.hash, "hex"));
}

export function toPaise(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return NaN;
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) ? amount : NaN;
}

// Shared by browser returns and server-to-server notifications.
export async function recordPayuResult(body: Record<string, string>) {
  return db.transaction(async tx => {
    const [attempt] = await tx.select().from(payuTransactionsTable)
      .where(eq(payuTransactionsTable.txnid, body.txnid)).limit(1);
    const paymentId = attempt?.paymentId;
    const [payment] = await tx.select().from(paymentsTable)
      .where(paymentId ? eq(paymentsTable.id, paymentId) : eq(paymentsTable.payuTxnId, body.txnid))
      .for("update").limit(1);
    if (!payment) return { result: "not_found" as const };

    // Re-read AFTER acquiring the payment lock: two callbacks can arrive together.
    const [currentAttempt] = await tx.select().from(payuTransactionsTable)
      .where(eq(payuTransactionsTable.txnid, body.txnid)).limit(1);
    if (currentAttempt?.credited || (!currentAttempt && payment.paymentStatus === "PAID")) {
      return { result: "success" as const };
    }
    const amount = toPaise(body.amount);
    const expected = toPaise(currentAttempt?.amount ?? payment.pendingAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount !== expected) {
      return { result: "amount_mismatch" as const };
    }
    if (body.status !== "success") {
      if (currentAttempt) await tx.update(payuTransactionsTable)
        .set({ status: body.status }).where(eq(payuTransactionsTable.txnid, body.txnid));
      return { result: body.status === "failure" ? "failed" as const : "pending" as const };
    }
    // Legacy attempts (started before the ledger existed) are recorded as well.
    if (!currentAttempt) await tx.insert(payuTransactionsTable).values({
      txnid: body.txnid, paymentId: payment.id, amount: body.amount,
    });
    const paid = toPaise(payment.advancePaid) + amount;
    const pending = Math.max(0, toPaise(payment.serviceFee) - paid);
    await tx.update(paymentsTable).set({
      advancePaid: (paid / 100).toFixed(2),
      pendingAmount: (pending / 100).toFixed(2),
      paymentStatus: pending === 0 ? "PAID" : "PARTIAL",
      // Keep the merchant txnid. mihpayid is a different identifier.
    }).where(eq(paymentsTable.id, payment.id));
    await tx.update(payuTransactionsTable).set({
      credited: true, status: "success", mihpayid: body.mihpayid || null,
    }).where(eq(payuTransactionsTable.txnid, body.txnid));
    return { result: "success" as const };
  });
}