import assert from "node:assert/strict";
import crypto from "node:crypto";
import express from "express";
import { db, pool, casesTable, paymentsTable, payuTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyPayuHash } from "../src/lib/payu";

// Local integration test only: synthetic credentials, never real payment secrets.
process.env.PAYU_KEY = "synthetic-test-key";
process.env.PAYU_SALT = "synthetic-test-salt";
const { default: router } = await import("../src/routes/payu");
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use((req, _res, next) => {
  (req as unknown as { log: { error: () => void } }).log = { error: () => {} };
  next();
});
app.use("/api", router);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>(resolve => server.once("listening", resolve));
const port = (server.address() as { port: number }).port;
let paymentId: number | undefined;

function signed(txnid: string, status = "success", amount = "75.00", additionalCharges?: string) {
  const body: Record<string, string> = {
    key: "synthetic-test-key", txnid, status, amount, productinfo: "Test service",
    firstname: "Test", email: "test@example.invalid", mihpayid: "synthetic-payu-id",
  };
  if (additionalCharges) body.additionalCharges = additionalCharges;
  // Independently implement PayU's documented reverse-hash fixture.
  const source = `${additionalCharges ? `${additionalCharges}|` : ""}synthetic-test-salt|${status}|||||||||||${body.email}|${body.firstname}|${body.productinfo}|${amount}|${txnid}|synthetic-test-key`;
  body.hash = crypto.createHash("sha512").update(source).digest("hex");
  return body;
}
async function send(body: Record<string, string>, webhook = true) {
  return fetch(`http://127.0.0.1:${port}/api/payu/callback${webhook ? "?webhook=1" : ""}`, {
    method: "POST", body: new URLSearchParams(body), redirect: "manual",
  });
}
async function payment() {
  return (await db.select().from(paymentsTable).where(eq(paymentsTable.id, paymentId!)))[0];
}

try {
  const [caseRow] = await db.select({ id: casesTable.id }).from(casesTable).limit(1);
  assert.ok(caseRow, "A development case is required to attach the temporary test payment");
  const [created] = await db.insert(paymentsTable).values({
    caseId: caseRow.id, serviceFee: "100.00", advancePaid: "25.00",
    pendingAmount: "75.00", paymentStatus: "PARTIAL",
  }).returning();
  paymentId = created.id;
  const txnid = `test-${crypto.randomUUID()}`;
  const newerTxnid = `test-${crypto.randomUUID()}`;
  await db.insert(payuTransactionsTable).values([
    { txnid, paymentId, amount: "75.00" },
    { txnid: newerTxnid, paymentId, amount: "75.00" },
  ]);
  await db.update(paymentsTable).set({ payuTxnId: newerTxnid }).where(eq(paymentsTable.id, paymentId));

  assert.equal(verifyPayuHash(signed(txnid), "synthetic-test-key", "synthetic-test-salt"), true);
  assert.equal(verifyPayuHash(signed(txnid, "success", "75.00", "2.00"), "synthetic-test-key", "synthetic-test-salt"), true);
  assert.equal(verifyPayuHash({ ...signed(txnid), hash: "invalid" }, "synthetic-test-key", "synthetic-test-salt"), false);
  assert.equal((await send({ ...signed(txnid), amount: "1.00" })).status, 400, "Tampering rejected");
  assert.equal((await send(signed(txnid, "success", "1.00"))).status, 400, "Signed wrong amount rejected");
  assert.equal((await payment()).advancePaid, "25.00");
  assert.equal((await send(signed(txnid, "failure"))).status, 200);
  assert.equal((await send(signed(txnid, "pending"))).status, 200);
  assert.equal((await payment()).paymentStatus, "PARTIAL", "Failure and pending do not mark paid");

  // A delayed confirmation for the older attempt still works; concurrent delivery is idempotent.
  const callbacks = await Promise.all([send(signed(txnid)), send(signed(txnid)), send(signed(txnid), false)]);
  assert.deepEqual(callbacks.map(r => r.status), [200, 200, 303]);
  assert.match(callbacks[2].headers.get("location") || "", /payu=success/);
  const paid = await payment();
  assert.equal(paid.advancePaid, "100.00");
  assert.equal(paid.pendingAmount, "0.00");
  assert.equal(paid.paymentStatus, "PAID");
  assert.equal(paid.payuTxnId, newerTxnid, "Merchant transaction ID is not replaced with PayU ID");
  await send(signed(txnid, "failure"));
  assert.equal((await payment()).paymentStatus, "PAID", "A late failure cannot undo success");
  console.log("PASS: valid signatures, fees, tampering, amount checks, failure/pending, delayed retries, concurrent duplicates, browser redirect, and balance updates.");
} finally {
  if (paymentId) await db.delete(paymentsTable).where(eq(paymentsTable.id, paymentId));
  server.close();
  await pool.end();
}