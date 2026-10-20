import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// This integration test deliberately refuses all remote databases.
const databaseUrl = new URL(process.env.DATABASE_URL || "");
if (!["127.0.0.1", "localhost"].includes(databaseUrl.hostname)) {
  throw new Error("Bundle verification requires an isolated local test database.");
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { Pool } = createRequire(new URL("../lib/db/package.json", import.meta.url))("pg");
const pool = new Pool({ connectionString: databaseUrl.toString() });
const directory = await mkdtemp(path.join(tmpdir(), "cir-standalone-"));
const email = `bundle-fixture-${randomBytes(6).toString("hex")}@example.invalid`;
const password = randomBytes(24).toString("hex");
const secret = randomBytes(32).toString("hex");
let userId;
let child;
let sessionTableRenamed = false;
const listener = createServer();
await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const origin = `http://127.0.0.1:${port}`;

async function start() {
  child = spawn(process.execPath, ["index.mjs"], {
    cwd: directory,
    env: { ...process.env, DATABASE_URL: databaseUrl.toString(), NODE_ENV: "production", SESSION_SECRET: secret, ADMIN_OWNER_PASSWORD: "", PORT: String(port), LOG_LEVEL: "silent" },
    stdio: ["ignore", "ignore", "pipe"],
  });
  // Drain stderr, but never publish raw database connection errors.
  child.stderr.resume();
  for (let count = 0; count < 80; count++) {
    if (child.exitCode !== null) throw new Error("The standalone production server exited before becoming ready.");
    try {
      if ((await fetch(`${origin}/api/healthz`, { signal: AbortSignal.timeout(1000) })).ok) return;
    } catch { /* Await startup only. */ }
    await delay(100);
  }
  throw new Error("The standalone production server did not become ready.");
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const stopped = new Promise(resolve => child.once("exit", resolve));
  child.kill("SIGTERM");
  await stopped;
}
async function login(attemptPassword = password) {
  return fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: attemptPassword }),
  });
}

try {
  await cp(path.join(root, "dist"), directory, { recursive: true, filter: source => !source.endsWith(".map") });
  const fixture = await pool.query(
    "INSERT INTO public.users (email, name, password_hash, role) VALUES ($1, $2, $3, 'OWNER') RETURNING id",
    [email, "Temporary standalone test", createHash("sha256").update(password + "cir_salt_2026").digest("hex")],
  );
  userId = fixture.rows[0].id;
  await start();
  const page = await fetch(`${origin}/admin/login`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  const html = await page.text();
  const asset = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  assert.ok(asset, "The built page references an asset on the same host.");
  assert.equal((await fetch(`${origin}${asset}`)).status, 200);
  const unknownApi = await fetch(`${origin}/api/not-a-real-route`);
  assert.match(unknownApi.headers.get("content-type"), /application\/json/);
  assert.equal((await login("deliberately-wrong-fixture-password")).status, 401);
  const response = await login();
  assert.equal(response.status, 200, "The existing-format OWNER fixture can sign in.");
  assert.equal((await response.json()).user.role, "OWNER");
  const cookieHeader = response.headers.get("set-cookie") || "";
  assert.match(cookieHeader, /;\s*Secure/i);
  assert.match(cookieHeader, /;\s*HttpOnly/i);
  assert.match(cookieHeader, /SameSite=Lax/i);
  const cookie = cookieHeader.split(";")[0];
  assert.equal((await fetch(`${origin}/api/auth/me`, { headers: { cookie } })).status, 200);
  const upgraded = await pool.query("SELECT password_hash FROM public.users WHERE id = $1", [userId]);
  assert.ok(upgraded.rows[0].password_hash.startsWith("scrypt$"));
  const proxiedLogin = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://hostinger-fixture.invalid",
      "x-forwarded-proto": "https",
      "x-forwarded-host": "hostinger-fixture.invalid",
    },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(proxiedLogin.status, 200, "A same-origin login works behind Hostinger's forwarded public host.");
  assert.equal((await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://unrelated-fixture.invalid" },
    body: JSON.stringify({ email, password }),
  })).status, 403, "An unrelated browser origin remains blocked.");
  await stop();
  await start();
  assert.equal((await fetch(`${origin}/api/auth/me`, { headers: { cookie } })).status, 200, "Session survives restarting the compiled server.");

  await pool.query("ALTER TABLE public.auth_sessions RENAME TO auth_sessions_test_missing");
  sessionTableRenamed = true;
  const unavailable = await login();
  assert.equal(unavailable.status, 503, "A missing session table is not reported as a wrong password.");
  assert.match((await unavailable.json()).error, /Database setup is incomplete/);
  await pool.query("ALTER TABLE public.auth_sessions_test_missing RENAME TO auth_sessions");
  sessionTableRenamed = false;
  console.log("Standalone Hostinger bundle passed: React deep links/assets, JSON API routing, legacy OWNER login, verified Secure cookies, restart persistence, and missing-session diagnostics.");
} finally {
  await stop();
  if (sessionTableRenamed) await pool.query("ALTER TABLE public.auth_sessions_test_missing RENAME TO auth_sessions");
  if (userId !== undefined) {
    await pool.query("DELETE FROM public.auth_sessions WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM public.users WHERE id = $1", [userId]);
  }
  await pool.end();
  await rm(directory, { recursive: true, force: true });
}
