import { Router } from "express";
import { db } from "@workspace/db";
import { leadsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { CreateLeadBody, UpdateLeadBody, ListLeadsQueryParams, UpdateLeadParams } from "@workspace/api-zod";

const router = Router();

router.get("/leads/stats", async (req, res): Promise<void> => {
  const all = await db.select().from(leadsTable);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLeads = all.filter(l => new Date(l.createdAt) >= today);
  res.json({
    total: all.length,
    new: all.filter(l => l.stage === "NEW").length,
    contacted: all.filter(l => l.stage === "CONTACTED").length,
    scheduled: all.filter(l => l.stage === "SCHEDULED").length,
    converted: all.filter(l => l.stage === "CONVERTED").length,
    completed: all.filter(l => l.stage === "COMPLETED").length,
    todayCount: todayLeads.length,
  });
});

router.get("/leads", async (req, res): Promise<void> => {
  const parsed = ListLeadsQueryParams.safeParse(req.query);
  const conditions = [];
  if (parsed.success && parsed.data.stage) {
    conditions.push(eq(leadsTable.stage, parsed.data.stage as "NEW" | "CONTACTED" | "SCHEDULED" | "CONVERTED" | "COMPLETED"));
  }
  if (parsed.success && parsed.data.source) {
    conditions.push(eq(leadsTable.source, parsed.data.source as "HOMEPAGE" | "CONTACT" | "CHATBOT" | "REFERRAL"));
  }
  const leads = conditions.length > 0
    ? await db.select().from(leadsTable).where(and(...conditions)).orderBy(desc(leadsTable.createdAt))
    : await db.select().from(leadsTable).orderBy(desc(leadsTable.createdAt));
  res.json(leads);
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [lead] = await db.insert(leadsTable).values(parsed.data).returning();
  res.status(201).json(lead);
});

router.get("/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id)).limit(1);
  if (!lead) { res.status(404).json({ error: "Not found" }); return; }
  res.json(lead);
});

router.patch("/leads/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [lead] = await db.update(leadsTable).set(parsed.data).where(eq(leadsTable.id, id)).returning();
  if (!lead) { res.status(404).json({ error: "Not found" }); return; }
  res.json(lead);
});

export default router;
