import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, casesTable, paymentsTable, ticketsTable, documentsTable, notificationsTable } from "@workspace/db";
import { eq, desc, like, or, and } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { revokeUserSessions } from "../lib/session";
import {
  ListCustomersQueryParams, CreateCustomerBody, UpdateCustomerParams, UpdateCustomerBody, DeleteCustomerParams
} from "@workspace/api-zod";

const router = Router();

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

// GET /customers
router.get("/customers", async (req, res): Promise<void> => {
  const qParsed = ListCustomersQueryParams.safeParse(req.query);
  const search = qParsed.success ? qParsed.data.search : undefined;
  let customers;
  if (search) {
    const s = `%${search}%`;
    customers = await db.select().from(usersTable)
      .where(and(
        eq(usersTable.role, "CUSTOMER"),
        or(like(usersTable.name, s), like(usersTable.mobile, s), like(usersTable.email, s))
      ))
      .orderBy(desc(usersTable.createdAt));
  } else {
    customers = await db.select().from(usersTable)
      .where(eq(usersTable.role, "CUSTOMER"))
      .orderBy(desc(usersTable.createdAt));
  }
  res.json(customers.map(({ passwordHash: _, ...u }) => u));
});

// POST /customers
router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data. Name, email, and mobile are required." }); return; }
  const { password, ...data } = parsed.data;
  if (password.length < 12) { res.status(400).json({ error: "Password must be at least 12 characters long." }); return; }
  const email = data.email.toLowerCase().trim();
  const mobile = normalisePhone(data.mobile);
  if (mobile.length !== 10) { res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number." }); return; }
  const [existingEmail] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const [existingPhone] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.mobile, mobile)).limit(1);
  if (existingEmail || existingPhone) { res.status(409).json({ error: "A customer with this email or mobile number already exists." }); return; }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ ...data, email, mobile, passwordHash, role: "CUSTOMER" }).returning();
  const { passwordHash: _, ...safe } = user;
  res.status(201).json(safe);
});

// GET /customers/:id
router.get("/customers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "Customer not found" }); return; }
  const { passwordHash: _, ...safe } = user;
  res.json(safe);
});

// PATCH /customers/:id
router.patch("/customers/:id", async (req, res): Promise<void> => {
  const pParsed = UpdateCustomerParams.safeParse(req.params);
  if (!pParsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const bParsed = UpdateCustomerBody.safeParse(req.body);
  if (!bParsed.success) { res.status(400).json({ error: bParsed.error.message }); return; }
  const { password, ...profileData } = bParsed.data;
  const updateData = { ...profileData } as Record<string, string | undefined>;
  if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();
  if (updateData.mobile) {
    updateData.mobile = normalisePhone(updateData.mobile);
    if (updateData.mobile.length !== 10) { res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number." }); return; }
    const [existingMobile] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.mobile, updateData.mobile))
      .limit(1);
    if (existingMobile && existingMobile.id !== pParsed.data.id) { res.status(409).json({ error: "A customer with this mobile number already exists." }); return; }
  }
  if (password) {
    if (password.length < 12) { res.status(400).json({ error: "Password must be at least 12 characters long." }); return; }
    updateData.passwordHash = await hashPassword(password);
  }
  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, pParsed.data.id)).returning();
  if (!user) { res.status(404).json({ error: "Customer not found" }); return; }
  if (password) await revokeUserSessions(user.id);
  const { passwordHash: _, ...safe } = user;
  res.json(safe);
});

// DELETE /customers/:id
router.delete("/customers/:id", async (req, res): Promise<void> => {
  const pParsed = DeleteCustomerParams.safeParse(req.params);
  if (!pParsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { id } = pParsed.data;
  try {
    const userCases = await db.select().from(casesTable).where(eq(casesTable.customerId, id));
    for (const c of userCases) {
      await db.delete(documentsTable).where(eq(documentsTable.caseId, c.id));
      await db.delete(paymentsTable).where(eq(paymentsTable.caseId, c.id));
    }
    await db.delete(casesTable).where(eq(casesTable.customerId, id));
    await db.delete(ticketsTable).where(eq(ticketsTable.customerId, id));
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, id));
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true, message: "Customer and all related data deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

export default router;
