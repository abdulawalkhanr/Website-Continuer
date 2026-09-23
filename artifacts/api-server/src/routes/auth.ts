import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, notificationsTable, otpChallengesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import https from "https";
import { LoginBody, RegisterBody, SendOtpBody, UpdateProfileBody, VerifyOtpBody } from "@workspace/api-zod";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "cir_salt_2026").digest("hex");
}

type SessionReq = { session: Record<string, unknown>; sessionId: string };
function getSession(req: object): Record<string, unknown> {
  return (req as unknown as SessionReq).session;
}

function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

function hashOtp(mobile: string, otp: string): string {
  const secret = process.env.SESSION_SECRET ?? "cir_otp_development_salt";
  return createHash("sha256").update(`${mobile}:${otp}:${secret}`).digest("hex");
}

function otpMatches(expectedHash: string, mobile: string, otp: string): boolean {
  const actualHash = hashOtp(mobile, otp);
  return timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(actualHash, "hex"));
}

interface SmsSendResult {
  sent: boolean;
  providerStatus?: string;
  providerMessage?: string;
  httpStatus?: number;
}

async function sendSmsOtp(mobile: string, otp: string): Promise<SmsSendResult> {
  const authKey = process.env.APITXT_AUTH_KEY;
  if (!authKey) {
    return { sent: false, providerStatus: "MISSING_SERVER_KEY" };
  }

  const body = new URLSearchParams({
    authkey: authKey,
    mobile: `91${mobile}`,
    otp,
    channel: "sms",
  }).toString();

  return new Promise((resolve) => {
    const options = {
      hostname: "apitxt.com",
      path: "/api/sendOTP",
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "content-length": Buffer.byteLength(body),
        "cache-control": "no-cache",
      },
    };
    const reqHttp = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data) as { status?: string; message?: string };
          const httpStatus = res.statusCode ?? 500;
          resolve({
            sent:
              httpStatus >= 200 &&
              httpStatus < 300 &&
              json.status?.toLowerCase() === "success",
            providerStatus: json.status,
            providerMessage: json.message,
            httpStatus,
          });
        } catch {
          resolve({ sent: false, providerStatus: "INVALID_RESPONSE", httpStatus: res.statusCode });
        }
      });
    });
    reqHttp.setTimeout(10_000, () => reqHttp.destroy());
    reqHttp.on("error", (error) => resolve({
      sent: false,
      providerStatus: error.message === "socket hang up" ? "TIMEOUT" : "NETWORK_ERROR",
    }));
    reqHttp.write(body);
    reqHttp.end();
  });
}

// POST /auth/otp/send
router.post("/auth/otp/send", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number" });
    return;
  }
  const phone = normalisePhone(parsed.data.mobile);
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(
    and(eq(usersTable.mobile, phone), eq(usersTable.role, "CUSTOMER")),
  ).limit(1);
  if (!user) {
    res.status(404).json({ error: "No customer account was found for this mobile number." });
    return;
  }

  const [existing] = await db.select().from(otpChallengesTable).where(eq(otpChallengesTable.mobile, phone)).limit(1);
  if (existing && Date.now() - existing.createdAt.getTime() < 60_000) {
    res.status(429).json({ error: "OTP already sent. Please wait 60 seconds before requesting again." });
    return;
  }

  const otp = generateOtp();
  const otpHash = hashOtp(phone, otp);
  await db.insert(otpChallengesTable).values({
    mobile: phone,
    otpHash,
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60_000),
  }).onConflictDoUpdate({
    target: otpChallengesTable.mobile,
    set: {
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const smsResult = await sendSmsOtp(phone, otp);
  if (!smsResult.sent) {
    await db.delete(otpChallengesTable).where(
      and(eq(otpChallengesTable.mobile, phone), eq(otpChallengesTable.otpHash, otpHash)),
    );
    req.log.error({
      mobileSuffix: phone.slice(-4),
      providerStatus: smsResult.providerStatus,
      providerMessage: smsResult.providerMessage,
      providerHttpStatus: smsResult.httpStatus,
    }, "API TXT failed to send login OTP");
    res.status(502).json({ error: "We could not send the OTP right now. Please try again shortly." });
    return;
  }

  res.json({ success: true, message: `OTP sent to +91 ${phone}` });
});

// POST /auth/otp/verify
router.post("/auth/otp/verify", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid mobile number and 6-digit OTP." });
    return;
  }

  const phone = normalisePhone(parsed.data.mobile);
  const [entry] = await db.select().from(otpChallengesTable).where(eq(otpChallengesTable.mobile, phone)).limit(1);
  if (!entry) {
    res.status(400).json({ error: "No OTP found for this number. Please request a new OTP." });
    return;
  }
  if (Date.now() > entry.expiresAt.getTime()) {
    await db.delete(otpChallengesTable).where(eq(otpChallengesTable.mobile, phone));
    res.status(400).json({ error: "OTP has expired. Please request a new one." });
    return;
  }
  if (entry.attempts >= 5) {
    await db.delete(otpChallengesTable).where(eq(otpChallengesTable.mobile, phone));
    res.status(400).json({ error: "Too many wrong attempts. Please request a new OTP." });
    return;
  }

  if (!otpMatches(entry.otpHash, phone, parsed.data.otp)) {
    const attempts = entry.attempts + 1;
    if (attempts >= 5) {
      await db.delete(otpChallengesTable).where(eq(otpChallengesTable.mobile, phone));
      res.status(400).json({ error: "Too many wrong attempts. Please request a new OTP." });
      return;
    }
    await db.update(otpChallengesTable).set({ attempts }).where(eq(otpChallengesTable.mobile, phone));
    res.status(400).json({ error: `Incorrect OTP. ${5 - attempts} attempt(s) remaining.` });
    return;
  }

  const [user] = await db.select().from(usersTable).where(
    and(eq(usersTable.mobile, phone), eq(usersTable.role, "CUSTOMER")),
  ).limit(1);
  if (!user) {
    await db.delete(otpChallengesTable).where(eq(otpChallengesTable.mobile, phone));
    res.status(404).json({ error: "No customer account was found for this mobile number." });
    return;
  }

  await db.delete(otpChallengesTable).where(eq(otpChallengesTable.mobile, phone));
  const { passwordHash: _, ...safeUser } = user;
  getSession(req).userId = user.id;
  res.json({ user: safeUser, token: `session_${user.id}` });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Email and password required" }); return; }
  const { email, password } = parsed.data;
  const hash = hashPassword(password);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
  const ownerPasswordHash = process.env.ADMIN_OWNER_PASSWORD
    ? hashPassword(process.env.ADMIN_OWNER_PASSWORD)
    : null;
  const validStoredPassword = user?.passwordHash === hash;
  const validOwnerSecret =
    user?.role === "OWNER" &&
    ownerPasswordHash !== null &&
    ownerPasswordHash === hash;

  if (!user || (!validStoredPassword && !validOwnerSecret)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  getSession(req).userId = user.id;
  res.json({ user: safeUser, token: `session_${user.id}` });
});

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide valid name, email, password (min 6 chars), and mobile number" });
    return;
  }
  const { password, ...data } = parsed.data;
  const email = data.email.toLowerCase().trim();
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists. Please login instead." });
    return;
  }
  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({ ...data, email, passwordHash, role: "CUSTOMER" }).returning();
  await db.insert(notificationsTable).values({
    userId: user.id,
    title: "Welcome to CIR Consultation Service!",
    message: `Dear ${user.name}, your account has been created successfully. Our team will contact you within 24 hours to get started on your case.`,
    type: "GENERAL",
  }).catch(() => {});
  const { passwordHash: _, ...safeUser } = user;
  getSession(req).userId = user.id;
  res.status(201).json({ user: safeUser, token: `session_${user.id}` });
});

// POST /auth/logout
router.post("/auth/logout", async (req, res): Promise<void> => {
  getSession(req).userId = undefined;
  res.json({ success: true });
});

// GET /auth/me
router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = getSession(req).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

// PATCH /auth/profile
router.patch("/auth/profile", async (req, res): Promise<void> => {
  const userId = getSession(req).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { password, currentPassword, ...profileData } = parsed.data;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!existing) { res.status(404).json({ error: "User not found" }); return; }
  const updateData: Record<string, unknown> = { ...profileData };
  if (password) {
    if (currentPassword && existing.passwordHash !== hashPassword(currentPassword)) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    updateData.passwordHash = hashPassword(password);
  }
  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
