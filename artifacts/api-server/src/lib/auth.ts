import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { and, eq } from "drizzle-orm";
import { db, casesTable, staffAssignmentsTable, staffProfilesTable, usersTable } from "@workspace/db";
import { getSession } from "./session";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32;
const ADMIN_ROLES = ["OWNER", "MANAGER", "EXECUTIVE"] as const;
const STAFF_ROLE = "STAFF" as const;

export type AuthPrincipal = { id: number; role: string };

function deriveKey(password: string, salt: Buffer, length: number, options: { N: number; r: number; p: number; maxmem: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await deriveKey(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  const parts = stored.split("$");
  if (parts[0] === "scrypt" && parts.length === 6) {
    const [, n, r, p, saltHex, hashHex] = parts;
    const N = Number(n);
    const R = Number(r);
    const P = Number(p);
    if (
      !Number.isSafeInteger(N) || N < 16_384 || N > 131_072 ||
      !Number.isSafeInteger(R) || R < 1 || R > 16 ||
      !Number.isSafeInteger(P) || P < 1 || P > 4 ||
      !/^[a-f0-9]{32}$/.test(saltHex) ||
      !/^[a-f0-9]{64}$/.test(hashHex)
    ) return { valid: false, needsUpgrade: false };

    const expected = Buffer.from(hashHex, "hex");
    const actual = await deriveKey(password, Buffer.from(saltHex, "hex"), expected.length, {
      N, r: R, p: P, maxmem: 64 * 1024 * 1024,
    });
    return { valid: timingSafeEqual(expected, actual), needsUpgrade: false };
  }

  // Existing accounts use this legacy format. Keep it verifiable so a valid login
  // can transparently replace the weak hash with a per-user scrypt hash.
  if (/^[a-f0-9]{64}$/.test(stored)) {
    const expected = Buffer.from(stored, "hex");
    const actual = createHash("sha256").update(password + "cir_salt_2026").digest();
    return { valid: timingSafeEqual(expected, actual), needsUpgrade: true };
  }
  return { valid: false, needsUpgrade: false };
}

export async function getRequestUser(req: Request): Promise<AuthPrincipal | null> {
  const request = req as Request & { authPrincipal?: AuthPrincipal };
  if (request.authPrincipal) return request.authPrincipal;
  const userId = getSession(req).userId;
  if (typeof userId !== "number" || !Number.isSafeInteger(userId)) return null;
  const [user] = await db.select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) {
    getSession(req).userId = undefined;
    return null;
  }
  request.authPrincipal = user;
  return user;
}

export function isAdmin(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export async function requireAdmin(req: Request): Promise<AuthPrincipal | null> {
  const user = await getRequestUser(req);
  return user && isAdmin(user.role) ? user : null;
}

async function isStaffProfileActive(userId: number): Promise<boolean> {
  const [profile] = await db.select({ accountStatus: staffProfilesTable.accountStatus })
    .from(staffProfilesTable)
    .where(eq(staffProfilesTable.userId, userId))
    .limit(1);
  return profile?.accountStatus === "ACTIVE";
}

export async function requireStaff(req: Request): Promise<AuthPrincipal | null> {
  const user = await getRequestUser(req);
  if (!user || user.role !== STAFF_ROLE || !(await isStaffProfileActive(user.id))) return null;
  return user;
}

export async function requireAdminOrStaff(req: Request): Promise<AuthPrincipal | null> {
  const user = await getRequestUser(req);
  if (!user) return null;
  if (isAdmin(user.role)) return user;
  if (user.role === STAFF_ROLE && await isStaffProfileActive(user.id)) return user;
  return null;
}

export async function userOwnsCase(userId: number, caseId: number): Promise<boolean> {
  const [caseRow] = await db.select({ id: casesTable.id })
    .from(casesTable)
    .where(and(eq(casesTable.id, caseId), eq(casesTable.customerId, userId)))
    .limit(1);
  return Boolean(caseRow);
}

export async function staffHasCase(userId: number, caseId: number): Promise<boolean> {
  const [assignment] = await db.select({ id: staffAssignmentsTable.id })
    .from(staffAssignmentsTable)
    .where(and(
      eq(staffAssignmentsTable.staffId, userId),
      eq(staffAssignmentsTable.caseId, caseId),
      eq(staffAssignmentsTable.isActive, true),
    ))
    .limit(1);
  if (assignment) return true;
  const [caseRow] = await db.select({ id: casesTable.id })
    .from(casesTable)
    .where(and(eq(casesTable.id, caseId), eq(casesTable.assignedToId, userId)))
    .limit(1);
  return Boolean(caseRow);
}
