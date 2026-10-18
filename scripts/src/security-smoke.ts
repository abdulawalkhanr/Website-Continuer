import assert from "node:assert/strict";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { once } from "node:events";
import { scryptSync } from "node:crypto";
import { db, pool, casesTable, documentsTable, paymentsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run the security smoke test against a production environment.");
}
process.env.NODE_ENV ??= "test";

const newEmail = () => `security-smoke-${randomBytes(8).toString("hex")}@example.invalid`;
const email = newEmail();
const legacyEmail = newEmail();
const password = `Smoke-${randomBytes(16).toString("hex")}`;
const legacyPassword = `Legacy-${randomBytes(16).toString("hex")}`;
const mobile = String(randomInt(1_000_000_000, 9_999_999_999));
const { default: app } = await import(new URL("../../artifacts/api-server/src/app.ts", import.meta.url).href);
const server = app.listen(0, "127.0.0.1");
let restartedServer: typeof server | undefined;
let customerId: number | undefined;
let otherCustomerId: number | undefined;
let caseId: number | undefined;

async function startServer(instance: typeof server): Promise<string> {
  await once(instance, "listening");
  const address = instance.address();
  if (!address || typeof address === "string") throw new Error("Security test server did not bind to a local port.");
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(instance: typeof server): Promise<void> {
  if (!instance.listening) return;
  await new Promise<void>((resolve, reject) => instance.close((error: Error | undefined) => error ? reject(error) : resolve()));
}

try {
  const salt = randomBytes(16);
  const passwordHash = `scrypt$16384$8$1$${salt.toString("hex")}$${scryptSync(password, salt, 32, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
  const [customer] = await db.insert(usersTable).values({
    name: "Security test customer",
    email,
    mobile,
    passwordHash,
    role: "CUSTOMER",
  }).returning({ id: usersTable.id });
  customerId = customer.id;

  const [legacyCustomer] = await db.insert(usersTable).values({
    name: "Legacy password test",
    email: legacyEmail,
    mobile: null,
    passwordHash: createHash("sha256").update(legacyPassword + "cir_salt_2026").digest("hex"),
    role: "CUSTOMER",
  }).returning({ id: usersTable.id });
  otherCustomerId = legacyCustomer.id;

  const caseNumber = `SEC-${randomBytes(8).toString("hex").toUpperCase()}`;
  const [caseRow] = await db.insert(casesTable).values({
    caseNumber,
    customerId: customer.id,
    serviceType: "Security test only",
  }).returning({ id: casesTable.id });
  caseId = caseRow.id;
  await db.insert(documentsTable).values({ caseId, name: "Private test document", type: "OTHER", status: "PENDING" });
  const [payment] = await db.insert(paymentsTable).values({
    caseId,
    serviceFee: "100.00",
    advancePaid: "0.00",
    pendingAmount: "100.00",
  }).returning({ id: paymentsTable.id });

  const base = await startServer(server);
  const request = (path: string, init?: RequestInit) => fetch(`${base}${path}`, init);
  const withCookie = (path: string, cookie: string) => request(path, { headers: { cookie } });

  for (const path of [
    "/api/payments",
    "/api/documents?caseId=1",
    "/api/customers",
    "/api/admin/dashboard",
    "/api/cases",
    "/api/referrals",
    "/api/notifications",
  ]) {
    assert.equal((await request(path)).status, 401, `Anonymous access was not blocked: ${path}`);
  }
  assert.equal((await request("/api/cases/track")).status, 400, "Case tracking requires both identifiers.");
  assert.equal((await request("/api/healthz")).status, 200, "The public health endpoint remains available.");
  assert.equal((await request("/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.invalid" },
    body: "{}",
  })).status, 403, "Cross-origin write requests are blocked.");

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200, "Scrypt password login succeeds.");
  const loginBody = await login.json() as Record<string, unknown>;
  assert.equal("token" in loginBody, false, "Login does not return a reusable session token.");
  const setCookie = login.headers.get("set-cookie") || "";
  assert.match(setCookie, /HttpOnly/i, "Session cookie is HttpOnly.");
  assert.match(setCookie, /SameSite=Lax/i, "Session cookie is SameSite=Lax.");
  const cookie = setCookie.split(";")[0];
  assert.ok(cookie, "Login creates a session cookie.");
  assert.equal((await withCookie("/api/auth/me", cookie)).status, 200, "A signed-in customer can read their own profile.");
  assert.equal((await withCookie("/api/customers", cookie)).status, 403, "A customer cannot read the customer directory.");
  assert.equal((await withCookie("/api/cases", cookie)).status, 200, "A customer can list their own cases.");
  assert.equal((await withCookie(`/api/cases/${caseRow.id}`, cookie)).status, 200, "A customer can read their own case.");
  assert.equal((await withCookie(`/api/payments/${payment.id}`, cookie)).status, 200, "A customer can read their own payment.");
  assert.equal((await withCookie(`/api/documents?caseId=${caseRow.id}`, cookie)).status, 200, "A customer can read their own case documents.");
  assert.equal((await withCookie("/api/documents/admin-all", cookie)).status, 403, "A customer cannot read all documents.");
  assert.equal((await withCookie(`/api/cases/track?caseNumber=${caseNumber}&mobile=${mobile}`, cookie)).status, 200, "Case tracking accepts the registered mobile and case ID together.");

  const legacyLogin = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: legacyEmail, password: legacyPassword }),
  });
  assert.equal(legacyLogin.status, 200, "A legacy account can still sign in.");
  const [upgradedUser] = await db.select({ passwordHash: usersTable.passwordHash })
    .from(usersTable).where(eq(usersTable.id, legacyCustomer.id)).limit(1);
  assert.ok(upgradedUser.passwordHash.startsWith("scrypt$"), "A legacy password is upgraded after successful sign-in.");
  const legacyCookie = (legacyLogin.headers.get("set-cookie") || "").split(";")[0];
  const otherPayments = await (await withCookie("/api/payments", legacyCookie)).json() as unknown[];
  assert.equal(otherPayments.length, 0, "A customer cannot list another customer's payment.");
  assert.equal((await withCookie(`/api/cases/${caseRow.id}`, legacyCookie)).status, 403, "A customer cannot read another customer's case.");
  assert.equal((await withCookie(`/api/documents?caseId=${caseRow.id}`, legacyCookie)).status, 403, "A customer cannot read another customer's documents.");

  await closeServer(server);
  restartedServer = app.listen(0, "127.0.0.1");
  const restartedBase = await startServer(restartedServer);
  assert.equal((await fetch(`${restartedBase}/api/auth/me`, { headers: { cookie } })).status, 200, "The authenticated session survives an app restart.");
  assert.equal((await fetch(`${restartedBase}/api/auth/logout`, { method: "POST", headers: { cookie } })).status, 200, "Logout succeeds.");
  assert.equal((await fetch(`${restartedBase}/api/auth/me`, { headers: { cookie } })).status, 401, "Logout revokes the database-backed session.");

  console.log("Security smoke tests passed: access controls, same-origin writes, ownership checks, legacy password upgrade, persistent sessions, and logout.");
} finally {
  await closeServer(server);
  if (restartedServer) await closeServer(restartedServer);
  if (caseId !== undefined) {
    await db.delete(documentsTable).where(eq(documentsTable.caseId, caseId));
    await db.delete(paymentsTable).where(eq(paymentsTable.caseId, caseId));
    await db.delete(casesTable).where(eq(casesTable.id, caseId));
  }
  if (customerId !== undefined) await db.delete(usersTable).where(eq(usersTable.id, customerId));
  if (otherCustomerId !== undefined) await db.delete(usersTable).where(eq(usersTable.id, otherCustomerId));
  await pool.end();
}
