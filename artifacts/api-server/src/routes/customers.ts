import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, desc, like, or } from "drizzle-orm";
import { CreateCustomerBody, UpdateCustomerBody, ListCustomersQueryParams } from "@workspace/api-zod";
import { createHash } from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "cir_salt_2026").digest("hex");
}

router.get("/customers", async (req, res): Promise<void> => {
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  let customers;
  if (parsed.success && parsed.data.search) {
    const s = `%${parsed.data.search}%`;
    customers = await db.select().from(usersTable)
      .where(or(like(usersTable.name, s), like(usersTable.mobile, s)))
      .orderBy(desc(usersTable.createdAt));
  } else {
    customers = await db.select().from(usersTable)
      .where(eq(usersTable.role, "CUSTOMER"))
      .orderBy(desc(usersTable.createdAt));
  }
  const safe = customers.map(({ passwordHash: _, ...u }) => u);
  res.json(safe);
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { password, ...data } = parsed.data;
  const passwordHash = hashPassword(password || "cir_default_2026");
  const [user] = await db.insert(usersTable).values({ ...data, passwordHash, role: "CUSTOMER" }).returning();
  const { passwordHash: _, ...safe } = user;
  res.status(201).json(safe);
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { passwordHash: _, ...safe } = user;
  res.json(safe);
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { passwordHash: _, ...safe } = user;
  res.json(safe);
});

export default router;
