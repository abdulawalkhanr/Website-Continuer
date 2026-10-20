import type { PoolConfig } from "pg";

/** Pure configuration helper: never prints or returns credentials to a browser. */
export function databasePoolConfig(env: NodeJS.ProcessEnv): PoolConfig {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  let url: URL;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use PostgreSQL, not a MySQL or HTTPS API URL.");
  }
  const supabase = url.hostname.endsWith(".supabase.com") || url.hostname.endsWith(".supabase.co");
  const max = Number(env.DATABASE_POOL_MAX || 5);
  if (!Number.isInteger(max) || max < 1 || max > 20) {
    throw new Error("DATABASE_POOL_MAX must be an integer between 1 and 20.");
  }
  const config: PoolConfig = {
    connectionString: env.DATABASE_URL,
    max,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    query_timeout: 15_000,
  };
  if (supabase || env.DATABASE_SSL_CA) {
    if (url.searchParams.get("sslmode") === "disable") {
      throw new Error("SSL cannot be disabled for Supabase.");
    }
    if (["sslcert", "sslkey", "sslrootcert"].some(key => url.searchParams.has(key))) {
      throw new Error("Use DATABASE_SSL_CA for a custom database CA certificate, not certificate file paths in DATABASE_URL.");
    }
    // pg's connection-string SSL settings otherwise overwrite the explicit CA
    // and verification settings. Always verify the database certificate.
    url.searchParams.delete("sslmode");
    config.connectionString = url.toString();
    config.ssl = {
      rejectUnauthorized: true,
      ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA.replace(/\\n/g, "\n") } : {}),
    };
  }
  // node-postgres uses unnamed statements unless a query is explicitly named.
  // This app never calls Drizzle .prepare(name), so port 6543 is supported.
  return config;
}
