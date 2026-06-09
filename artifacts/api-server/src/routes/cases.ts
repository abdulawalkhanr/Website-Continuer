import { Router } from "express";
import { db } from "@workspace/db";
import { casesTable, usersTable, documentsTable, paymentsTable, notificationsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  ListCasesQueryParams, CreateCaseBody, UpdateCaseParams, UpdateCaseBody, DeleteCaseParams,
  TrackCaseQueryParams
} from "@workspace/api-zod";

const router = Router();

async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  // Use MAX(id) instead of COUNT(*) so deletions never produce collisions
  const [result] = await db.select({ maxId: sql<number>`COALESCE(MAX(id), 0)` }).from(casesTable);
  const seq = Number(result?.maxId || 0) + 1;
  return `CIR-${year}-${String(seq).padStart(4, "0")}`;
}

async function enrichCase(c: typeof casesTable.$inferSelect) {
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, c.customerId)).limit(1);
  const assignedTo = c.assignedToId
    ? (await db.select().from(usersTable).where(eq(usersTable.id, c.assignedToId)).limit(1))[0]
    : null;
  return { ...c, customerName: customer?.name || null, customerMobile: customer?.mobile || null, assignedToName: assignedTo?.name || null };
}

// GET /cases/track
router.get("/cases/track", async (req, res): Promise<void> => {
  const parsed = TrackCaseQueryParams.safeParse(req.query);
  const { caseNumber, mobile } = parsed.success ? parsed.data : { caseNumber: undefined, mobile: undefined };
  if (!caseNumber && !mobile) { res.status(400).json({ error: "Provide caseNumber or mobile" }); return; }
  let caseRow;
  if (caseNumber) {
    [caseRow] = await db.select().from(casesTable).where(eq(casesTable.caseNumber, caseNumber.trim())).limit(1);
  } else if (mobile) {
    const [customer] = await db.select().from(usersTable).where(eq(usersTable.mobile, mobile.trim())).limit(1);
    if (customer) {
      [caseRow] = await db.select().from(casesTable).where(eq(casesTable.customerId, customer.id)).orderBy(desc(casesTable.createdAt)).limit(1);
    }
  }
  if (!caseRow) { res.status(404).json({ error: "Case not found. Please check your Case ID or mobile number." }); return; }
  const enriched = await enrichCase(caseRow);
  res.json({
    caseNumber: caseRow.caseNumber,
    customerName: enriched.customerName || "Customer",
    serviceType: caseRow.serviceType,
    status: caseRow.status,
    progressPercentage: caseRow.progressPercentage,
    expectedCompletionDate: caseRow.expectedCompletionDate,
    assignedToName: enriched.assignedToName,
    notes: caseRow.notes,
    updatedAt: caseRow.updatedAt.toISOString(),
  });
});

// GET /cases/stats
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

// GET /cases
router.get("/cases", async (req, res): Promise<void> => {
  const parsed = ListCasesQueryParams.safeParse(req.query);
  const conditions = [];
  if (parsed.success) {
    if (parsed.data.customerId) conditions.push(eq(casesTable.customerId, parsed.data.customerId));
    if (parsed.data.status) conditions.push(eq(casesTable.status, parsed.data.status));
  }
  const cases = conditions.length > 0
    ? await db.select().from(casesTable).where(and(...conditions)).orderBy(desc(casesTable.createdAt))
    : await db.select().from(casesTable).orderBy(desc(casesTable.createdAt));
  const enriched = await Promise.all(cases.map(enrichCase));
  res.json(enriched);
});

// POST /cases
router.post("/cases", async (req, res): Promise<void> => {
  const parsed = CreateCaseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "customerId and serviceType are required" }); return; }
  try {
    const caseNumber = await generateCaseNumber();
    // Build insert data explicitly to avoid passing undefined fields to Drizzle
    const insertData: typeof casesTable.$inferInsert = {
      caseNumber,
      customerId: parsed.data.customerId,
      serviceType: parsed.data.serviceType,
    };
    if (parsed.data.assignedToId !== undefined) insertData.assignedToId = parsed.data.assignedToId;
    if (parsed.data.notes !== undefined) insertData.notes = parsed.data.notes;
    if (parsed.data.expectedCompletionDate !== undefined) insertData.expectedCompletionDate = parsed.data.expectedCompletionDate;
    const [caseRow] = await db.insert(casesTable).values(insertData).returning();
    const enriched = await enrichCase(caseRow);
    await db.insert(notificationsTable).values({
      userId: caseRow.customerId,
      title: "Case Registered Successfully",
      message: `Your case ${caseNumber} has been registered for ${caseRow.serviceType}. Our team will contact you within 24 hours.`,
      type: "CASE_UPDATE",
    }).catch(() => {});
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to create case");
    res.status(500).json({ error: "Failed to create case. Please try again." });
  }
});

// GET /cases/:id
router.get("/cases/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [caseRow] = await db.select().from(casesTable).where(eq(casesTable.id, id)).limit(1);
  if (!caseRow) { res.status(404).json({ error: "Case not found" }); return; }
  res.json(await enrichCase(caseRow));
});

// PATCH /cases/:id
router.patch("/cases/:id", async (req, res): Promise<void> => {
  const pParsed = UpdateCaseParams.safeParse(req.params);
  if (!pParsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const bParsed = UpdateCaseBody.safeParse(req.body);
  if (!bParsed.success) { res.status(400).json({ error: bParsed.error.message }); return; }
  try {
    const [caseRow] = await db.update(casesTable).set(bParsed.data).where(eq(casesTable.id, pParsed.data.id)).returning();
    if (!caseRow) { res.status(404).json({ error: "Case not found" }); return; }
    const enriched = await enrichCase(caseRow);
    if (bParsed.data.status && enriched.customerName) {
      const statusLabel = bParsed.data.status.replace(/_/g, " ");
      await db.insert(notificationsTable).values({
        userId: caseRow.customerId,
        title: "Case Status Updated",
        message: `Your case ${caseRow.caseNumber} status: ${statusLabel}. ${caseRow.notes ? `Note: ${caseRow.notes}` : ""}`,
        type: "CASE_UPDATE",
      }).catch(() => {});
    }
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to update case");
    res.status(500).json({ error: "Failed to update case. Please try again." });
  }
});

// DELETE /cases/:id
router.delete("/cases/:id", async (req, res): Promise<void> => {
  const pParsed = DeleteCaseParams.safeParse(req.params);
  if (!pParsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { id } = pParsed.data;
  try {
    await db.delete(documentsTable).where(eq(documentsTable.caseId, id));
    await db.delete(paymentsTable).where(eq(paymentsTable.caseId, id));
    await db.delete(casesTable).where(eq(casesTable.id, id));
    res.json({ success: true, message: "Case deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete case" });
  }
});

export default router;
