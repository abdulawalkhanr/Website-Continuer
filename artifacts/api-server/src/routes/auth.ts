import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { LoginBody, RegisterBody, UpdateProfileBody } from "@workspace/api-zod";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "cir_salt_2026").digest("hex");
}

type SessionReq = { session: Record<string, unknown>; sessionId: string };

function getSession(req: object): Record<string, unknown> {
  return (req as unknown as SessionReq).session;
}

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Email and password required" }); return; }
  const { email, password } = parsed.data;
  const hash = hashPassword(password);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);
  if (!user || user.passwordHash !== hash) {
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
