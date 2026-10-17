import express, { type Express } from "express";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import { persistentSessionMiddleware } from "./lib/session";

const app: Express = express();

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
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
      if (new URL(origin).origin !== `${req.protocol}://${req.get("host")}`) {
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
app.use(cookieParser());
app.use(persistentSessionMiddleware);

app.use("/api", router);

export default app;
