import { Router } from "express";
import { db } from "@workspace/db";
import { casesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { CreateCaseBody, UpdateCaseBody, ListCasesQueryParams, TrackCaseQueryParams } from "@workspace/api-zod";

const router = Router();

function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `CIR-${year}-${num}`;
}

router.get("/cases/track", async (req, res): Promise<void> => {
  const parsed = TrackCaseQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { caseNumber, mobile } = parsed.data;
  let caseRow;
  if (caseNumber) {
    [caseRow] = await db.select().from(casesTable).where(eq(casesTable.caseNumber, caseNumber)).limit(1);
  } else if (mobile) {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.mobile, mobile)).limit(1);
    if (customer) {
      [caseRow] = await db.select().from(casesTable).where(eq(casesTable.customerId, customer.id)).orderBy(desc(casesTable.createdAt)).limit(1);
    }
  }
  if (!caseRow) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, caseRow.customerId)).limit(1);
  res.json({
    caseNumber: caseRow.caseNumber,
    customerName: customer?.name || "Customer",
    serviceType: caseRow.serviceType,
    status: caseRow.status,
    progressPercentage: caseRow.progressPercentage,
    expectedCompletionDate: caseRow.expectedCompletionDate,
    updatedAt: caseRow.updatedAt.toISOString(),
  });
});

router.get("/cases/stats", async (req, res): Promise<void> => {
  const all = await db.select().from(casesTable);
  res.json({
    total: all.length,
    active: all.filter(c => c.status !== "COMPLETED").length,
    completed: all.filter(c => c.status === "COMPLETED").length,
    inProgress: all.filter(c => ["DISPUTE_SUBMITTED", "BUREAU_LENDER_REVIEW", "FOLLOW_UP"].includes(c.status)).length,
    documentsSubmitted: all.filter(c => c.status === "DOCUMENTS_SUBMITTED").length,
    disputeSubmitted: all.filter(c => c.status === "DISPUTE_SUBMITTED").length,
  });
});

router.get("/cases", async (req, res): Promise<void> => {
  const parsed = ListCasesQueryParams.safeParse(req.query);
  const conditions = [];
  if (parsed.success) {
    if (parsed.data.customerId) {
      conditions.push(eq(casesTable.customerId, parsed.data.customerId));
    }
    if (parsed.data.status) {
      conditions.push(eq(casesTable.status, parsed.data.status as "DOCUMENTS_SUBMITTED" | "CASE_REVIEW" | "DOCUMENTATION_VERIFIED" | "DISPUTE_SUBMITTED" | "BUREAU_LENDER_REVIEW" | "FOLLOW_UP" | "COMPLETED"));
    }
  }
  const cases = conditions.length > 0
    ? await db.select().from(casesTable).where(and(...conditions)).orderBy(desc(casesTable.createdAt))
    : await db.select().from(casesTable).orderBy(desc(casesTable.createdAt));
  
  const enriched = await Promise.all(cases.map(async (c) => {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, c.customerId)).limit(1);
    const assignedTo = c.assignedToId
      ? (await db.select().from(usersTable).where(eq(usersTable.id, c.assignedToId)).limit(1))[0]
      : null;
    return {
      ...c,
      customerName: customer?.name || null,
      customerMobile: customer?.mobile || null,
      assignedToName: assignedTo?.name || null,
    };
  }));
  res.json(enriched);
});

router.post("/cases", async (req, res): Promise<void> => {
  const parsed = CreateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const caseNumber = generateCaseNumber();
  const [caseRow] = await db.insert(casesTable).values({ ...parsed.data, caseNumber }).returning();
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, caseRow.customerId)).limit(1);
  res.status(201).json({ ...caseRow, customerName: customer?.name || null, customerMobile: customer?.mobile || null, assignedToName: null });
});

router.get("/cases/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [caseRow] = await db.select().from(casesTable).where(eq(casesTable.id, id)).limit(1);
  if (!caseRow) { res.status(404).json({ error: "Not found" }); return; }
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, caseRow.customerId)).limit(1);
  const assignedTo = caseRow.assignedToId
    ? (await db.select().from(usersTable).where(eq(usersTable.id, caseRow.assignedToId)).limit(1))[0]
    : null;
  res.json({ ...caseRow, customerName: customer?.name || null, customerMobile: customer?.mobile || null, assignedToName: assignedTo?.name || null });
});

router.patch("/cases/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = UpdateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [caseRow] = await db.update(casesTable).set(parsed.data).where(eq(casesTable.id, id)).returning();
  if (!caseRow) { res.status(404).json({ error: "Not found" }); return; }
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, caseRow.customerId)).limit(1);
  res.json({ ...caseRow, customerName: customer?.name || null, customerMobile: customer?.mobile || null, assignedToName: null });
});

export default router;
