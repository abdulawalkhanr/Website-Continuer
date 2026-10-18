import { Router } from "express";
import { db } from "@workspace/db";
import {
  casesTable,
  usersTable,
  documentsTable,
  paymentsTable,
  notificationsTable,
  ticketsTable,
  staffAssignmentsTable,
  staffTasksTable,
  caseActivitiesTable,
  caseNotesTable,
  caseCommsTable,
} from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { getRequestUser, isAdmin, staffHasCase } from "../lib/auth";
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
  if (!caseNumber || !mobile) { res.status(400).json({ error: "Provide both caseNumber and registered mobile number" }); return; }
  const phone = mobile.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const [caseRow] = await db.select().from(casesTable)
    .where(eq(casesTable.caseNumber, caseNumber.trim().toUpperCase()))
    .limit(1);
  const [customer] = caseRow
    ? await db.select({ id: usersTable.id }).from(usersTable)
      .where(and(eq(usersTable.id, caseRow.customerId), eq(usersTable.mobile, phone)))
      .limit(1)
    : [undefined];
  if (!caseRow || !customer) { res.status(404).json({ error: "Case not found. Please check your Case ID and registered mobile number." }); return; }
  res.json({
    caseNumber: caseRow.caseNumber,
    customerName: "Verified customer",
    serviceType: caseRow.serviceType,
    status: caseRow.status,
    progressPercentage: caseRow.progressPercentage,
    expectedCompletionDate: caseRow.expectedCompletionDate,
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
  const user = await getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isAdmin(user.role) && user.role !== "CUSTOMER") { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = ListCasesQueryParams.safeParse(req.query);
  const conditions = [];
  if (user.role === "CUSTOMER") {
    conditions.push(eq(casesTable.customerId, user.id));
  } else if (parsed.success && parsed.data.customerId) {
    if (parsed.data.customerId) conditions.push(eq(casesTable.customerId, parsed.data.customerId));
  }
  if (parsed.success && parsed.data.status) conditions.push(eq(casesTable.status, parsed.data.status));
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
  const user = await getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isAdmin(user.role) && user.role !== "CUSTOMER") { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const caseNumber = await generateCaseNumber();
    // Build insert data explicitly to avoid passing undefined fields to Drizzle
    const insertData: typeof casesTable.$inferInsert = {
      caseNumber,
      customerId: isAdmin(user.role) ? parsed.data.customerId : user.id,
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
  const user = await getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const allowed = isAdmin(user.role)
    || (user.role === "CUSTOMER" && caseRow.customerId === user.id)
    || (user.role === "STAFF" && await staffHasCase(user.id, id));
  if (!allowed) { res.status(403).json({ error: "Forbidden" }); return; }
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
    const [existingCase] = await db.select({ id: casesTable.id }).from(casesTable).where(eq(casesTable.id, id)).limit(1);
    if (!existingCase) { res.status(404).json({ error: "Case not found" }); return; }

    await db.transaction(async (tx) => {
      await tx.delete(caseCommsTable).where(eq(caseCommsTable.caseId, id));
      await tx.delete(caseNotesTable).where(eq(caseNotesTable.caseId, id));
      await tx.delete(caseActivitiesTable).where(eq(caseActivitiesTable.caseId, id));
      await tx.delete(staffAssignmentsTable).where(eq(staffAssignmentsTable.caseId, id));
      await tx.delete(staffTasksTable).where(eq(staffTasksTable.relatedCaseId, id));
      await tx.delete(documentsTable).where(eq(documentsTable.caseId, id));
      await tx.delete(paymentsTable).where(eq(paymentsTable.caseId, id));
      await tx.delete(ticketsTable).where(eq(ticketsTable.caseId, id));
      await tx.delete(casesTable).where(eq(casesTable.id, id));
    });
    res.json({ success: true, message: "Case deleted" });
  } catch (err) {
    req.log.error({ err, caseId: id }, "Failed to delete case");
    res.status(500).json({ error: "Failed to delete case" });
  }
});

export default router;
