import { createHash } from "crypto";
import { db } from "@workspace/db";
import { usersTable, staffProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request } from "express";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + "cir_salt_2026").digest("hex");
}

type SessionReq = { session: Record<string, unknown>; sessionId: string };

export function getSession(req: object): Record<string, unknown> {
  return (req as unknown as SessionReq).session;
}

export function getSessionUserId(req: Request): number | undefined {
  return getSession(req).userId as number | undefined;
}

const ADMIN_ROLES = ["OWNER", "MANAGER", "EXECUTIVE"] as const;
const STAFF_ROLE = "STAFF" as const;

export async function requireAdmin(req: Request): Promise<{ id: number; role: string } | null> {
  const userId = getSessionUserId(req);
  if (!userId) return null;
  const [user] = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return null;
  if (!(ADMIN_ROLES as readonly string[]).includes(user.role)) return null;
  return user;
}

async function isStaffProfileActive(userId: number): Promise<boolean> {
  const [profile] = await db
    .select({ accountStatus: staffProfilesTable.accountStatus })
    .from(staffProfilesTable)
    .where(eq(staffProfilesTable.userId, userId))
    .limit(1);
  return profile?.accountStatus === "ACTIVE";
}

export async function requireStaff(req: Request): Promise<{ id: number; role: string } | null> {
  const userId = getSessionUserId(req);
  if (!userId) return null;
  const [user] = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return null;
  if (user.role !== STAFF_ROLE) return null;
  // Enforce live profile status — stale sessions for suspended/inactive/archived accounts are rejected.
  if (!(await isStaffProfileActive(userId))) return null;
  return user;
}

export async function requireAdminOrStaff(req: Request): Promise<{ id: number; role: string } | null> {
  const userId = getSessionUserId(req);
  if (!userId) return null;
  const [user] = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) return null;
  const allowed = [...ADMIN_ROLES, STAFF_ROLE] as string[];
  if (!allowed.includes(user.role)) return null;
  // For STAFF callers, also enforce live profile account status.
  if (user.role === STAFF_ROLE && !(await isStaffProfileActive(userId))) return null;
  return user;
}

export function isAdmin(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}
