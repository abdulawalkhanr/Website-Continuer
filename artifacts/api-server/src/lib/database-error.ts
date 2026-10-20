export function databaseErrorCode(error: unknown): string | undefined {
  let current = error;
  for (let depth = 0; depth < 6 && current && typeof current === "object"; depth++) {
    const value = current as { code?: unknown; cause?: unknown };
    if (typeof value.code === "string") return value.code;
    current = value.cause;
  }
  return undefined;
}

export function databaseUnavailableMessage(error: unknown): string {
  const code = databaseErrorCode(error);
  if (code === "42P01") return "Database setup is incomplete. Run the supplied Supabase missing-schema script, then retry.";
  if (code === "42703") return "An existing database table is missing a required column. Check the schema script's compatibility results.";
  if (code === "28P01" || code === "28000") return "The database connection was rejected. Check DATABASE_URL in Hostinger.";
  if (["SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "CERT_HAS_EXPIRED"].includes(code || "")) {
    return "The database certificate could not be verified. Check the Supabase CA certificate setting.";
  }
  return "The database or sign-in session is temporarily unavailable. Please check Hostinger runtime logs and retry.";
}
