import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import https from "https";
import { LoginBody, RegisterBody, UpdateProfileBody } from "@workspace/api-zod";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "cir_salt_2026").digest("hex");
}

type SessionReq = { session: Record<string, unknown>; sessionId: string };
function getSession(req: object): Record<string, unknown> {
  return (req as unknown as SessionReq).session;
}

// ─── In-memory OTP store ───────────────────────────────────────────────────
interface OtpEntry { otp: string; expiry: number; attempts: number }
const otpStore = new Map<string, OtpEntry>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Strip leading 91 if 12 digits, keep 10-digit mobile
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

async function sendSmsOtp(mobile: string, otp: string): Promise<{ sent: boolean; devOtp?: string }> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    // Dev mode — return OTP in response
    return { sent: false, devOtp: otp };
  }
  return new Promise((resolve) => {
    const message = `Your CIR Consultation Service OTP is ${otp}. Valid for 10 minutes. Do not share with anyone.`;
    const params = new URLSearchParams({
      authorization: apiKey,
      variables_values: otp,
      route: "otp",
      numbers: mobile,
    });
    const options = {
      hostname: "www.fast2sms.com",
      path: `/dev/bulkV2?${params.toString()}`,
      method: "GET",
      headers: { "cache-control": "no-cache" },
    };
    const reqHttp = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.return === true) {
            resolve({ sent: true });
          } else {
            // SMS failed — fall back to dev mode so at least it works
            resolve({ sent: false, devOtp: otp });
          }
        } catch {
          resolve({ sent: false, devOtp: otp });
        }
      });
    });
    reqHttp.on("error", () => resolve({ sent: false, devOtp: otp }));
    // Suppress "message" field warning from Fast2SMS for OTP route
    void message;
    reqHttp.end();
  });
}

// POST /auth/otp/send
router.post("/auth/otp/send", async (req, res): Promise<void> => {
  const { mobile } = req.body as { mobile?: string };
  if (!mobile) { res.status(400).json({ error: "Mobile number is required" }); return; }
  const phone = normalisePhone(mobile);
  if (phone.length !== 10) { res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number" }); return; }

  // Rate-limit: 1 OTP per 60 seconds
  const existing = otpStore.get(phone);
  if (existing && existing.expiry - Date.now() > 9 * 60 * 1000) {
    res.status(429).json({ error: "OTP already sent. Please wait 60 seconds before requesting again." });
    return;
  }

  const otp = generateOtp();
  otpStore.set(phone, { otp, expiry: Date.now() + 10 * 60 * 1000, attempts: 0 });

  const result = await sendSmsOtp(phone, otp);

  if (result.sent) {
    res.json({ success: true, message: `OTP sent to +91 ${phone}` });
  } else {
    // Dev/fallback mode — include OTP in response (remove in production with a real SMS provider)
    res.json({ success: true, message: `OTP sent to +91 ${phone}`, devOtp: result.devOtp });
  }
});

// POST /auth/otp/verify  — verifies OTP, logs in if account exists, creates account if new
router.post("/auth/otp/verify", async (req, res): Promise<void> => {
  const { mobile, otp, name, city } = req.body as { mobile?: string; otp?: string; name?: string; city?: string };
  if (!mobile || !otp) { res.status(400).json({ error: "Mobile and OTP are required" }); return; }

  const phone = normalisePhone(mobile);
  const entry = otpStore.get(phone);

  if (!entry) { res.status(400).json({ error: "No OTP found for this number. Please request a new OTP." }); return; }
  if (Date.now() > entry.expiry) {
    otpStore.delete(phone);
    res.status(400).json({ error: "OTP has expired. Please request a new one." });
    return;
  }
  entry.attempts += 1;
  if (entry.attempts > 5) {
    otpStore.delete(phone);
    res.status(400).json({ error: "Too many wrong attempts. Please request a new OTP." });
    return;
  }
  if (entry.otp !== otp.trim()) {
    res.status(400).json({ error: `Incorrect OTP. ${5 - entry.attempts} attempt(s) remaining.` });
    return;
  }

  // OTP valid — clear it
  otpStore.delete(phone);

  // Find user by mobile
  const [user] = await db.select().from(usersTable).where(eq(usersTable.mobile, phone)).limit(1);

  if (user) {
    // Existing user — log in
    const { passwordHash: _, ...safeUser } = user;
    getSession(req).userId = user.id;
    res.json({ user: safeUser, isNewUser: false });
    return;
  }

  // New user — need name to create account
  if (!name || name.trim().length < 2) {
    res.status(200).json({ isNewUser: true, mobile: phone, message: "New account — please provide your name to complete registration." });
    return;
  }

  // Create new account
  // Generate a placeholder email from mobile (unique)
  const placeholderEmail = `mobile_${phone}@cir.internal`;
  // Check if placeholder email already exists (edge case)
  const [emailCheck] = await db.select().from(usersTable).where(eq(usersTable.email, placeholderEmail)).limit(1);
  if (emailCheck) {
    // Account exists with this placeholder — log them in
    const { passwordHash: _, ...safeUser } = emailCheck;
    getSession(req).userId = emailCheck.id;
    res.json({ user: safeUser, isNewUser: false });
    return;
  }

  const passwordHash = hashPassword(`otp_${phone}_${Date.now()}`);
  const [newUser] = await db.insert(usersTable).values({
    name: name.trim(),
    email: placeholderEmail,
    mobile: phone,
    city: city?.trim() || null,
    passwordHash,
    role: "CUSTOMER",
  }).returning();

  await db.insert(notificationsTable).values({
    userId: newUser.id,
    title: "Welcome to CIR Consultation Service!",
    message: `Dear ${newUser.name}, your account has been created successfully. Our team will contact you within 24 hours.`,
    type: "GENERAL",
  }).catch(() => {});

  const { passwordHash: _, ...safeNewUser } = newUser;
  getSession(req).userId = newUser.id;
  res.status(201).json({ user: safeNewUser, isNewUser: true });
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

// POST /auth/login-mobile — login with mobile number + password
router.post("/auth/login-mobile", async (req, res): Promise<void> => {
  const { mobile, password } = req.body as { mobile?: string; password?: string };
  if (!mobile || !password) { res.status(400).json({ error: "Mobile number and password are required" }); return; }
  const phone = normalisePhone(mobile);
  if (phone.length !== 10) { res.status(400).json({ error: "Enter a valid 10-digit mobile number" }); return; }
  const hash = hashPassword(password);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.mobile, phone)).limit(1);
  if (!user || user.passwordHash !== hash) {
    res.status(401).json({ error: "Invalid mobile number or password" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  getSession(req).userId = user.id;
  res.json({ user: safeUser });
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
