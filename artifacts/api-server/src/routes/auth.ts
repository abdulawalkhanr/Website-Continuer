import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import https from "https";
import { LoginBody, RegisterBody, UpdateProfileBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/auth";
import { destroySession, getSession, regenerateSession } from "../lib/session";

const router = Router();

async function establishSession(req: object, userId: number): Promise<void> {
  await regenerateSession(req);
  getSession(req).userId = userId;
}

// OTPs are kept only as keyed digests so a process memory dump does not expose them.
interface OtpEntry { otpHash: string; expiry: number; attempts: number }
const otpStore = new Map<string, OtpEntry>();
const otpPepper = process.env.SESSION_SECRET || "development-only-otp-pepper";

function generateOtp(): string {
  return String(randomInt(100000, 1_000_000));
}

function digestOtp(phone: string, otp: string): string {
  return createHmac("sha256", otpPepper).update(`${phone}:${otp}`).digest("hex");
}

function matchesDigest(expectedHex: string, incomingHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const incoming = Buffer.from(incomingHex, "hex");
  return expected.length === incoming.length && timingSafeEqual(expected, incoming);
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Strip leading 91 if 12 digits, keep 10-digit mobile
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

async function sendSmsOtp(mobile: string, otp: string): Promise<{ sent: boolean }> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return { sent: false };
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
            resolve({ sent: false });
          }
        } catch {
          resolve({ sent: false });
        }
      });
    });
    reqHttp.on("error", () => resolve({ sent: false }));
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
  otpStore.set(phone, { otpHash: digestOtp(phone, otp), expiry: Date.now() + 10 * 60 * 1000, attempts: 0 });

  const result = await sendSmsOtp(phone, otp);

  if (result.sent) {
    res.json({ success: true, message: `OTP sent to +91 ${phone}` });
  } else {
    otpStore.delete(phone);
    if (process.env.NODE_ENV === "production") {
      res.status(503).json({ error: "SMS delivery is unavailable. Please try again later." });
      return;
    }
    res.json({ success: true, message: `Development OTP for +91 ${phone}`, devOtp: otp });
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
  if (!matchesDigest(entry.otpHash, digestOtp(phone, otp.trim()))) {
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
    await establishSession(req, user.id);
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
    await establishSession(req, emailCheck.id);
    res.json({ user: safeUser, isNewUser: false });
    return;
  }

  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
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
  await establishSession(req, newUser.id);
  res.status(201).json({ user: safeNewUser, isNewUser: true });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Email and password required" }); return; }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
  const passwordVerification = user
    ? await verifyPassword(password, user.passwordHash)
    : { valid: false, needsUpgrade: false };
  const ownerSecret = process.env.ADMIN_OWNER_PASSWORD;
  const validOwnerSecret =
    user?.role === "OWNER" &&
    Boolean(ownerSecret) &&
    constantTimeEqual(password, ownerSecret || "");

  if (!user || (!passwordVerification.valid && !validOwnerSecret)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (passwordVerification.valid && passwordVerification.needsUpgrade) {
    await db.update(usersTable).set({ passwordHash: await hashPassword(password) }).where(eq(usersTable.id, user.id));
  }
  const { passwordHash: _, ...safeUser } = user;
  await establishSession(req, user.id);
  res.json({ user: safeUser });
});

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide valid name, email, password (min 6 chars), and mobile number" });
    return;
  }
  const { password, ...data } = parsed.data;
  if (password.length < 12) {
    res.status(400).json({ error: "Password must be at least 12 characters long." });
    return;
  }
  const email = data.email.toLowerCase().trim();
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists. Please login instead." });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ ...data, email, passwordHash, role: "CUSTOMER" }).returning();
  await db.insert(notificationsTable).values({
    userId: user.id,
    title: "Welcome to CIR Consultation Service!",
    message: `Dear ${user.name}, your account has been created successfully. Our team will contact you within 24 hours to get started on your case.`,
    type: "GENERAL",
  }).catch(() => {});
  const { passwordHash: _, ...safeUser } = user;
  await establishSession(req, user.id);
  res.status(201).json({ user: safeUser });
});

// POST /auth/login-mobile — login with mobile number + password
router.post("/auth/login-mobile", async (req, res): Promise<void> => {
  const { mobile, password } = req.body as { mobile?: string; password?: string };
  if (!mobile || !password) { res.status(400).json({ error: "Mobile number and password are required" }); return; }
  const phone = normalisePhone(mobile);
  if (phone.length !== 10) { res.status(400).json({ error: "Enter a valid 10-digit mobile number" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.mobile, phone)).limit(1);
  const passwordVerification = user
    ? await verifyPassword(password, user.passwordHash)
    : { valid: false, needsUpgrade: false };
  if (!user || !passwordVerification.valid) {
    res.status(401).json({ error: "Invalid mobile number or password" });
    return;
  }
  if (passwordVerification.needsUpgrade) {
    await db.update(usersTable).set({ passwordHash: await hashPassword(password) }).where(eq(usersTable.id, user.id));
  }
  const { passwordHash: _, ...safeUser } = user;
  await establishSession(req, user.id);
  res.json({ user: safeUser });
});

// POST /auth/logout
router.post("/auth/logout", async (req, res): Promise<void> => {
  await destroySession(req, res);
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
    if (password.length < 12) {
      res.status(400).json({ error: "Password must be at least 12 characters long." });
      return;
    }
    if (!currentPassword) {
      res.status(400).json({ error: "Enter your current password to change it." });
      return;
    }
    const verification = await verifyPassword(currentPassword, existing.passwordHash);
    if (!verification.valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    updateData.passwordHash = await hashPassword(password);
  }
  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
