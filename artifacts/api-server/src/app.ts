import express, { type Express, type ErrorRequestHandler } from "express";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import { persistentSessionMiddleware } from "./lib/session";
import { databaseErrorCode, databaseUnavailableMessage } from "./lib/database-error";

const app: Express = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  if (process.env.NODE_ENV === "production" && req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  const origin = req.get("origin");
  if (origin) {
    try {
      // Hostinger may preserve the public host in X-Forwarded-Host while
      // forwarding to an internal Node host. trust proxy is limited to one hop.
      const publicHost = req.get("x-forwarded-host")?.split(",")[0]?.trim() || req.get("host");
      const requestOrigin = new URL(`${req.protocol}://${publicHost}`).origin;
      if (new URL(origin).origin !== requestOrigin) {
        res.status(403).json({ error: "Cross-origin requests are not allowed" });
        return;
      }
    } catch {
      res.status(403).json({ error: "Invalid request origin" });
      return;
    }
  }
  if (req.get("sec-fetch-site") === "cross-site" && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    res.status(403).json({ error: "Cross-site request blocked" });
    return;
  }
  next();
});

type LimitEntry = { count: number; resetAt: number };
const authLimits = new Map<string, LimitEntry>();
app.use((req, res, next) => {
  const route = req.path;
  const limit = route === "/api/auth/otp/send"
    ? { count: 5, windowMs: 60 * 60 * 1000 }
    : route === "/api/auth/otp/verify"
      ? { count: 15, windowMs: 15 * 60 * 1000 }
      : ["/api/auth/login", "/api/auth/login-mobile", "/api/auth/register"].includes(route)
        ? { count: 10, windowMs: 15 * 60 * 1000 }
        : route === "/api/auth/staff/login"
          ? { count: 10, windowMs: 15 * 60 * 1000 }
        : route === "/api/leads" && req.method === "POST"
          ? { count: 10, windowMs: 60 * 60 * 1000 }
        : route === "/api/referrals" && req.method === "POST"
          ? { count: 10, windowMs: 60 * 60 * 1000 }
        : route === "/api/cases/track"
          ? { count: 30, windowMs: 15 * 60 * 1000 }
          : null;
  if (!limit) return next();

  const now = Date.now();
  const key = `${route}:${req.ip}`;
  let entry = authLimits.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + limit.windowMs };
    authLimits.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > limit.count) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
    res.status(429).json({ error: "Too many requests. Please wait and try again." });
    return;
  }
  if (authLimits.size > 5000) {
    for (const [entryKey, value] of authLimits) {
      if (value.resetAt <= now) authLimits.delete(entryKey);
    }
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// A database outage must not prevent the static sign-in page from loading.
app.use("/api", cookieParser(), persistentSessionMiddleware, router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

const handleApiError: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) return next(error);
  const code = databaseErrorCode(error);
  req.log.error({ code }, "API request failed");
  if (code === "23505") {
    res.status(409).json({ error: "A record with these details already exists." });
    return;
  }
  const isDatabaseError = Boolean(code) || (error instanceof Error && error.message.startsWith("Failed query:"));
  res.status(isDatabaseError ? 503 : 500).json({
    error: isDatabaseError ? databaseUnavailableMessage(error) : "The server could not complete this request. Please check runtime logs.",
  });
};
app.use(handleApiError);

export default app;
