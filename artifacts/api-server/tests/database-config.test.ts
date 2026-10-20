import test from "node:test";
import assert from "node:assert/strict";
import { databasePoolConfig } from "../../../lib/db/src/connection";
import { databaseErrorCode, databaseUnavailableMessage } from "../src/lib/database-error";

test("Supabase transaction pooler uses verified TLS and bounded connections", () => {
  const config = databasePoolConfig({ DATABASE_URL: "postgresql://postgres.test:fixture-only@aws-0-example.pooler.supabase.com:6543/postgres?sslmode=require" });
  assert.equal(new URL(config.connectionString!).port, "6543");
  assert.equal(new URL(config.connectionString!).searchParams.has("sslmode"), false);
  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
  assert.equal(config.max, 5);
  assert.equal(config.connectionTimeoutMillis, 10_000);
  assert.equal(config.query_timeout, 15_000);
});
test("custom CA is retained rather than overwritten by URL sslmode", () => {
  const config = databasePoolConfig({
    DATABASE_URL: "postgresql://postgres.test:fixture-only@aws-0-example.pooler.supabase.com:6543/postgres?sslmode=verify-full",
    DATABASE_SSL_CA: "first\\nsecond",
  });
  assert.deepEqual(config.ssl, { rejectUnauthorized: true, ca: "first\nsecond" });
});
test("Supabase refuses disabled TLS and invalid pool sizes", () => {
  assert.throws(() => databasePoolConfig({ DATABASE_URL: "postgresql://postgres:fixture-only@db.example.supabase.co/postgres?sslmode=disable" }), /SSL cannot be disabled/);
  assert.throws(() => databasePoolConfig({ DATABASE_URL: "postgresql://localhost/test", DATABASE_POOL_MAX: "0" }), /DATABASE_POOL_MAX/);
});
test("local database behavior stays unchanged", () => {
  const config = databasePoolConfig({ DATABASE_URL: "postgresql://localhost:55432/test" });
  assert.equal(config.ssl, undefined);
  assert.equal(config.connectionString, "postgresql://localhost:55432/test");
});
test("nested database failures produce useful messages, not password errors", () => {
  const error = { cause: { code: "42P01" } };
  assert.equal(databaseErrorCode(error), "42P01");
  assert.match(databaseUnavailableMessage(error), /setup is incomplete/);
  assert.match(databaseUnavailableMessage({ code: "42703" }), /required column/);
  assert.match(databaseUnavailableMessage({ code: "28P01" }), /DATABASE_URL/);
});
