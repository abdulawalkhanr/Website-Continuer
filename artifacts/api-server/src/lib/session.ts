import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { RequestHandler, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";

const COOKIE_NAME = "session_id";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const configuredSecret = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === "production" && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error("SESSION_SECRET must be set to a random value of at least 32 characters in production");
}

const signingSecret = configuredSecret || randomBytes(32).toString("hex");

type SessionData = Record<string, unknown> & { userId?: number };
type SessionContext = {
  session: SessionData;
  sessionId: string;
  persisted: boolean;
  clearCookie: boolean;
};
type SessionRequest = Request & SessionContext;

function hashId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

function sign(sessionId: string): string {
  return createHmac("sha256", signingSecret).update(sessionId).digest("base64url");
}

function parseCookie(token: unknown): string | null {
  if (typeof token !== "string") return null;
  const [sessionId, signature, extra] = token.split(".");
  if (extra !== undefined || !/^[a-f0-9]{64}$/.test(sessionId || "") || !signature) return null;
  const expected = Buffer.from(sign(sessionId), "utf8");
  const actual = Buffer.from(signature, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return sessionId;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export function getSession(req: object): SessionData {
  return (req as SessionRequest).session;
}

export function getSessionId(req: object): string {
  return (req as SessionRequest).sessionId;
}

export async function regenerateSession(req: object): Promise<void> {
  const context = req as SessionRequest;
  if (context.persisted) {
    await db.delete(sessionsTable).where(eq(sessionsTable.sidHash, hashId(context.sessionId)));
  }
  context.sessionId = randomBytes(32).toString("hex");
  context.session = {};
  context.persisted = false;
  context.clearCookie = false;
}

export async function destroySession(req: object, res: Response): Promise<void> {
  const context = req as SessionRequest;
  if (context.persisted) {
    await db.delete(sessionsTable).where(eq(sessionsTable.sidHash, hashId(context.sessionId)));
  }
  context.session = {};
  context.persisted = false;
  context.clearCookie = true;
  res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
}

export const persistentSessionMiddleware: RequestHandler = (req, res, next) => {
  void (async () => {
    const sessionId = parseCookie(req.cookies?.[COOKIE_NAME]);
    let session: SessionData = {};
    let persisted = false;

    if (sessionId) {
      const sidHash = hashId(sessionId);
      const [saved] = await db.select().from(sessionsTable).where(eq(sessionsTable.sidHash, sidHash)).limit(1);
      if (saved && saved.expiresAt.getTime() > Date.now()) {
        session = { userId: saved.userId };
        persisted = true;
      } else if (saved) {
        await db.delete(sessionsTable).where(eq(sessionsTable.sidHash, sidHash));
      }
    }

    const context = req as SessionRequest;
    context.session = session;
    context.sessionId = sessionId || randomBytes(32).toString("hex");
    context.persisted = persisted;
    context.clearCookie = Boolean(req.cookies?.[COOKIE_NAME]) && !sessionId;

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (typeof context.session.userId !== "number") {
        if (context.clearCookie) {
          res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
        }
        originalJson(body);
        return res;
      }

      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      void db.insert(sessionsTable)
        .values({ sidHash: hashId(context.sessionId), userId: context.session.userId, expiresAt })
        .onConflictDoUpdate({
          target: sessionsTable.sidHash,
          set: { userId: context.session.userId, expiresAt },
        })
        .then(() => {
          res.cookie(COOKIE_NAME, `${context.sessionId}.${sign(context.sessionId)}`, cookieOptions());
          originalJson(body);
        })
        .catch((error: unknown) => {
          req.log.error({ err: error }, "Could not persist authenticated session");
          if (!res.headersSent) {
            res.statusCode = 500;
            originalJson({ error: "Could not save the sign-in session. Please try again." });
          }
        });
      return res;
    }) as typeof res.json;

    next();
  })().catch(next);
};
