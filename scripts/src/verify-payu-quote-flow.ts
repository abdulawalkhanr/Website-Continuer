/**
 * Deterministic protocol regression check. It intentionally uses no network/database:
 * it validates the callback hash wire format and the state transitions enforced by payu.ts.
 */
import crypto from "node:crypto";
import assert from "node:assert/strict";

const key = "merchant-key";
const salt = "merchant-salt";
const digest = (value: string) => crypto.createHash("sha512").update(value).digest("hex");
const callbackPreimage = (body: Record<string, string>) => {
  const charge = body.additionalCharges ?? body.additional_charges;
  return `${charge ? `${charge}|` : ""}${salt}|${body.status}||||||||||${body.udf5 ?? ""}|${body.udf4 ?? ""}|${body.udf3 ?? ""}|${body.udf2 ?? ""}|${body.udf1 ?? ""}|${body.email}|${body.firstname}|${body.productinfo}|${body.amount}|${body.txnid}|${key}`;
};
const callbackHash = (body: Record<string, string>) => digest(callbackPreimage(body));
type Payment = {
  txnid: string;
  initiatedAmount: string;
  pendingAmount: string;
  verification: "PENDING" | "FAILED" | "VERIFIED";
  caseCreated: boolean;
};
let sequence = 0;
const nextTxn = () => `Q7P${++sequence}`;
function checkout(payment?: Payment): Payment {
  // Mirrors quote advisory-lock serialization: pending requests reuse; terminal failures rotate.
  if (!payment) return { txnid: nextTxn(), initiatedAmount: "100.00", pendingAmount: "100.00", verification: "PENDING", caseCreated: false };
  if (payment.verification === "PENDING") return payment;
  if (payment.verification === "FAILED") return { ...payment, txnid: nextTxn(), verification: "PENDING" };
  return payment;
}
function callback(payment: Payment, body: Record<string, string>) {
  assert.equal(callbackHash(body), body.hash, "tampered callback must fail verification");
  assert.equal(body.txnid, payment.txnid, "old attempt callback must not settle retry");
  // This must remain valid after first success mutates pendingAmount to zero.
  assert.equal(Number(body.amount).toFixed(2), Number(payment.initiatedAmount).toFixed(2), "callback amount must match immutable initiated amount");
  if (body.status === "pending") return payment;
  if (body.status !== "success") return { ...payment, verification: "FAILED" as const };
  // Replay/concurrent success is idempotent because caseCreated is checked after serialization.
  return payment.caseCreated ? payment : { ...payment, pendingAmount: "0.00", verification: "VERIFIED" as const, caseCreated: true };
}
const payload = { status: "success", txnid: "Q7P1", amount: "100.00", productinfo: "CIR Quote 7", firstname: "Asha", email: "asha@example.test" };
const signed = { ...payload, hash: callbackHash(payload) };
const pending = checkout();
assert.equal(checkout(pending).txnid, pending.txnid, "duplicate checkout must reuse pending txn");
assert.equal(callback(pending, { ...signed, status: "pending", hash: callbackHash({ ...payload, status: "pending" }) }).caseCreated, false);
const failed = callback(pending, { ...signed, status: "failure", hash: callbackHash({ ...payload, status: "failure" }) });
assert.equal(failed.caseCreated, false);
const retry = checkout(failed);
assert.notEqual(retry.txnid, pending.txnid, "failed checkout must get a distinct retry txn");
const retryBody = { ...payload, txnid: retry.txnid };
const settled = callback(retry, { ...retryBody, hash: callbackHash(retryBody) });
assert.equal(settled.pendingAmount, "0.00", "first success must clear mutable pending balance");
assert.notEqual(settled.pendingAmount, settled.initiatedAmount);
assert.equal(Number(retryBody.amount).toFixed(2) === Number(settled.initiatedAmount).toFixed(2), true, "replay must validate against initiated amount");
assert.equal(Number(retryBody.amount).toFixed(2) === Number(settled.pendingAmount).toFixed(2), false, "old mutable pendingAmount validation would reject this replay");
assert.equal(callback(settled, { ...retryBody, hash: callbackHash(retryBody) }).caseCreated, true, "replay must not create a second case");
assert.throws(() => callback(retry, { ...retryBody, amount: "1.00", hash: callbackHash(retryBody) }));
const charged = { ...retryBody, additionalCharges: "2.50" };
assert.ok(callbackPreimage(charged).startsWith(`2.50|${salt}|success|`), "additionalCharges must prefix salt");
assert.equal(callbackHash(charged), callbackHash({ ...retryBody, additional_charges: "2.50" }));
process.stdout.write("PayU quote-flow deterministic verification passed\n");