import { Router } from "express";
import { db } from "@workspace/db";
import { ticketsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateTicketBody, UpdateTicketBody, ListTicketsQueryParams } from "@workspace/api-zod";
import { getRequestUser, isAdmin, requireAdmin, userOwnsCase } from "../lib/auth";

const router = Router();

router.get("/tickets", async (req, res): Promise<void> => {
  const parsed = ListTicketsQueryParams.safeParse(req.query);
  const user = await getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  let tickets;
  if (user.role === "CUSTOMER") {
    tickets = await db.select().from(ticketsTable)
      .where(eq(ticketsTable.customerId, user.id))
      .orderBy(desc(ticketsTable.createdAt));
  } else if (await requireAdmin(req)) {
    if (parsed.success && parsed.data.customerId) {
      tickets = await db.select().from(ticketsTable).where(eq(ticketsTable.customerId, parsed.data.customerId)).orderBy(desc(ticketsTable.createdAt));
    } else {
      tickets = await db.select().from(ticketsTable).orderBy(desc(ticketsTable.createdAt));
    }
  } else {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const enriched = await Promise.all(tickets.map(async (t) => {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, t.customerId)).limit(1);
    return { ...t, customerName: customer?.name || null };
  }));
  res.json(enriched);
});

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  let customerId = parsed.data.customerId;
  if (user.role === "CUSTOMER") customerId = user.id;
  else if (!isAdmin(user.role) && !(await requireAdmin(req))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const caseId = (parsed.data as typeof parsed.data & { caseId?: number }).caseId;
  if (caseId && !isAdmin(user.role)) {
    if (user.role !== "CUSTOMER" || !(await userOwnsCase(user.id, caseId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }
  const [ticket] = await db.insert(ticketsTable).values({ ...parsed.data, customerId }).returning();
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, ticket.customerId)).limit(1);
  res.status(201).json({ ...ticket, customerName: customer?.name || null });
});

router.get("/tickets/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, id)).limit(1);
  if (!ticket) { res.status(404).json({ error: "Not found" }); return; }
  const user = await getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (user.role === "CUSTOMER" ? ticket.customerId !== user.id : !(await requireAdmin(req))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, ticket.customerId)).limit(1);
  res.json({ ...ticket, customerName: customer?.name || null });
});

router.patch("/tickets/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid ID" }); return; }
  if (!(await requireAdmin(req))) { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = UpdateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [ticket] = await db.update(ticketsTable).set(parsed.data).where(eq(ticketsTable.id, id)).returning();
  if (!ticket) { res.status(404).json({ error: "Not found" }); return; }
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, ticket.customerId)).limit(1);
  res.json({ ...ticket, customerName: customer?.name || null });
});

export default router;
