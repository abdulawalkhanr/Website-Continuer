import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { createReportUpload, downloadReport, readReport, validateReportObject } from "../lib/private-storage";
import { analyzeReportText } from "../lib/report-analysis";
import {
  callbackRequestsTable, creditReportsTable, customerOnboardingsTable, db,
  notificationsTable, pricingRulesTable, quoteSnapshotsTable, usersTable,
} from "@workspace/db";
import { getSessionUserId, isAdmin, requireAdmin } from "../lib/auth";

const router = Router();
const MAX_BYTES = 15 * 1024 * 1024;
const safeId = (value: string | string[]): number => Number.parseInt(Array.isArray(value) ? value[0] : value, 10);
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function encryptPan(value: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required for PAN encryption");
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

// Kept private to make an intentional encrypted-at-rest format available for future bureau integrations.
export function decryptPan(ciphertext: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required for PAN decryption");
  const [iv, tag, encrypted] = ciphertext.split(".");
  const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

function maskPan(pan: string): string { return `${pan.slice(0, 2)}******${pan.slice(-2)}`; }
function reportResponse(report: typeof creditReportsTable.$inferSelect) {
  const { objectPath: _objectPath, ...safe } = report;
  return safe;
}
async function currentUser(req: Parameters<typeof getSessionUserId>[0]) {
  const id = getSessionUserId(req);
  if (!id) return null;
  const [user] = await db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return user ?? null;
}
async function ownedReport(req: Parameters<typeof getSessionUserId>[0], id: number) {
  const user = await currentUser(req);
  if (!user) return null;
  const [report] = await db.select().from(creditReportsTable).where(eq(creditReportsTable.id, id)).limit(1);
  if (!report || (!isAdmin(user.role) && report.customerId !== user.id)) return null;
  return report;
}

router.get("/onboarding", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [onboarding] = await db.select().from(customerOnboardingsTable).where(eq(customerOnboardingsTable.userId, user.id)).limit(1);
  res.json(onboarding ?? { userId: user.id, preferredLanguage: "ENGLISH", panName: null, panMasked: null, consentedAt: null, completedAt: null });
});

router.put("/onboarding", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  const body = req.body as { preferredLanguage?: "ENGLISH" | "HINDI" | "ASSAMESE"; panName?: string; pan?: string; consent?: boolean; complete?: boolean };
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!body.preferredLanguage || !["ENGLISH", "HINDI", "ASSAMESE"].includes(body.preferredLanguage) || !body.consent) {
    res.status(400).json({ error: "Preferred language and consent are required" }); return;
  }
  const pan = body.pan?.trim().toUpperCase();
  if (pan && !panPattern.test(pan)) { res.status(400).json({ error: "Invalid PAN format" }); return; }
  const values = { preferredLanguage: body.preferredLanguage, panName: body.panName?.trim() || null, ...(pan ? { panEncrypted: encryptPan(pan), panMasked: maskPan(pan) } : {}), consentedAt: new Date(), completedAt: body.complete ? new Date() : null };
  const [existing] = await db.select({ id: customerOnboardingsTable.id }).from(customerOnboardingsTable).where(eq(customerOnboardingsTable.userId, user.id)).limit(1);
  const [result] = existing
    ? await db.update(customerOnboardingsTable).set(values).where(eq(customerOnboardingsTable.id, existing.id)).returning()
    : await db.insert(customerOnboardingsTable).values({ userId: user.id, ...values }).returning();
  res.json(result);
});

router.post("/callback-requests", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = req.body as { message?: string; preferredTime?: string };
  const [item] = await db.insert(callbackRequestsTable).values({ userId: user.id, message: body.message?.slice(0, 1000) || null, preferredTime: body.preferredTime?.slice(0, 100) || null }).returning();
  res.status(201).json(item);
});
router.get("/admin/callback-requests", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req))) { res.status(403).json({ error: "Admin access required" }); return; }
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status && !["REQUESTED", "CONTACTED", "CLOSED"].includes(status)) { res.status(400).json({ error: "Invalid callback status" }); return; }
  const rows = await db.select({
    id: callbackRequestsTable.id, userId: callbackRequestsTable.userId, message: callbackRequestsTable.message, preferredTime: callbackRequestsTable.preferredTime, status: callbackRequestsTable.status,
    assignedToId: callbackRequestsTable.assignedToId, adminNotes: callbackRequestsTable.adminNotes, createdAt: callbackRequestsTable.createdAt, updatedAt: callbackRequestsTable.updatedAt,
    customerName: usersTable.name, customerMobile: usersTable.mobile, customerEmail: usersTable.email, preferredLanguage: customerOnboardingsTable.preferredLanguage,
  }).from(callbackRequestsTable).innerJoin(usersTable, eq(callbackRequestsTable.userId, usersTable.id)).leftJoin(customerOnboardingsTable, eq(customerOnboardingsTable.userId, usersTable.id)).where(status ? eq(callbackRequestsTable.status, status as "REQUESTED" | "CONTACTED" | "CLOSED") : undefined).orderBy(desc(callbackRequestsTable.createdAt));
  res.json(rows);
});
router.patch("/admin/callback-requests/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req); const id = safeId(req.params.id);
  const body = req.body as { status?: "REQUESTED" | "CONTACTED" | "CLOSED"; assignedToId?: number | null; adminNotes?: string | null };
  if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }
  if (body.status && !["REQUESTED", "CONTACTED", "CLOSED"].includes(body.status)) { res.status(400).json({ error: "Invalid callback status" }); return; }
  if (body.adminNotes != null && (typeof body.adminNotes !== "string" || body.adminNotes.length > 2000)) { res.status(400).json({ error: "Notes must be at most 2000 characters" }); return; }
  if (body.assignedToId != null) { const [assignee] = await db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable).where(eq(usersTable.id, body.assignedToId)).limit(1); if (!assignee || !["OWNER", "MANAGER", "EXECUTIVE", "STAFF"].includes(assignee.role)) { res.status(400).json({ error: "Assignee must be an admin-capable or staff user" }); return; } }
  const [updated] = await db.update(callbackRequestsTable).set({ ...body }).where(eq(callbackRequestsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Callback request not found" }); return; }
  if (body.status) await db.insert(notificationsTable).values({ userId: updated.userId, title: "Callback request update", message: body.status === "CLOSED" ? "Your callback request has been closed." : "Your callback request is being handled.", type: "GENERAL" }).catch((error) => req.log.warn({ err: error, callbackRequestId: id }, "Could not create callback notification"));
  res.json(updated);
});

router.get("/credit-reports", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const reports = await db.select().from(creditReportsTable).where(isAdmin(user.role) ? undefined : eq(creditReportsTable.customerId, user.id)).orderBy(desc(creditReportsTable.createdAt));
  res.json(reports.map(reportResponse));
});

router.get("/credit-reports/:id", async (req, res): Promise<void> => {
  const report = await ownedReport(req, safeId(req.params.id));
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(reportResponse(report));
});

router.post("/credit-reports/finalize", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  const body = req.body as { objectPath?: string; originalFilename?: string; contentType?: string; size?: number; customerId?: number; bureau?: string; version?: "ORIGINAL" | "UPDATED" | "RECTIFIED" };
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const customerId = isAdmin(user.role) && body.customerId ? body.customerId : user.id;
  if (!body.objectPath?.startsWith("/objects/") || !body.originalFilename || !["application/pdf", "image/jpeg", "image/png"].includes(body.contentType ?? "") || !body.size || body.size > MAX_BYTES) {
    res.status(400).json({ error: "A private PDF, JPG, or PNG no larger than 15MB is required" }); return;
  }
  if (customerId !== user.id && !isAdmin(user.role)) { res.status(403).json({ error: "Forbidden" }); return; }
  const objectPath = body.objectPath;
  const originalFilename = body.originalFilename;
  const contentType = body.contentType as "application/pdf" | "image/jpeg" | "image/png";
  try { await validateReportObject(objectPath, customerId, contentType, body.size); } catch { req.log.warn({ customerId }, "Rejected report upload"); res.status(400).json({ error: "Uploaded object could not be validated" }); return; }
  await db.update(creditReportsTable).set({ isCurrent: false }).where(eq(creditReportsTable.customerId, customerId));
  const [report] = await db.insert(creditReportsTable).values({ customerId, objectPath, originalFilename: originalFilename.slice(0, 255), contentType, uploaderId: user.id, bureau: body.bureau?.slice(0, 100) || null, version: body.version ?? "ORIGINAL" }).returning();
  res.status(201).json(reportResponse(report));
});

router.post("/credit-reports/upload-url", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  const body = req.body as { contentType?: string; size?: number; customerId?: number };
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const customerId = isAdmin(user.role) && body.customerId ? body.customerId : user.id;
  if (!body.size || body.size > MAX_BYTES || !["application/pdf", "image/jpeg", "image/png"].includes(body.contentType ?? "")) { res.status(400).json({ error: "Only PDF, JPG, or PNG up to 15MB is allowed" }); return; }
  const [customer] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, customerId)).limit(1);
  if (!customer) { res.status(404).json({ error: "Customer not found" }); return; }
  try { res.json(await createReportUpload(customerId, body.contentType!)); } catch { req.log.error({ customerId }, "Could not create report upload URL"); res.status(500).json({ error: "Could not create upload URL" }); }
});

router.get("/credit-reports/:id/download", async (req, res): Promise<void> => {
  const report = await ownedReport(req, safeId(req.params.id));
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  try {
    const stream = await downloadReport(report.objectPath);
    res.setHeader("Content-Type", report.contentType); res.setHeader("Content-Disposition", `attachment; filename="credit-report-${report.id}"`); res.setHeader("Cache-Control", "private, no-store");
    stream.on("error", (error) => { req.log.error({ err: error, reportId: report.id }, "Private report download failed"); if (!res.headersSent) res.status(404).json({ error: "Report file not found" }); else res.destroy(error); });
    stream.pipe(res);
  } catch (error) { req.log.error({ err: error, reportId: report.id }, "Private report download failed"); res.status(404).json({ error: "Report file not found" }); }
});

router.post("/credit-reports/:id/process", async (req, res): Promise<void> => {
  const report = await ownedReport(req, safeId(req.params.id));
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  const password = typeof (req.body as { password?: unknown }).password === "string" ? (req.body as { password: string }).password : undefined;
  let update: Partial<typeof creditReportsTable.$inferInsert> = { processingStatus: "NEEDS_MANUAL_REVIEW", manualReviewReason: "Automated extraction could not safely produce a complete report; manual review is required." };
  if (report.contentType === "application/pdf") {
    try {
      const buffer = await readReport(report.objectPath);
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer, ...(password ? { password } : {}) });
      const parsed = await parser.getText();
      await parser.destroy();
      const text = parsed.text.slice(0, 200_000);
      const score = /\b(?:credit\s*score|cibil\s*score)\D{0,30}([3-9]\d{2}|[1-2]\d{2})\b/i.exec(text)?.[1];
      const reportDate = /\b(\d{4}-\d{2}-\d{2})\b/.exec(text)?.[1];
      update = { ...update, analysis: { source: "deterministic_text_extraction", textExtracted: true }, accounts: [], factors: [], flags: [], score: score ? Number(score) : null, reportDate: reportDate ?? null, confidence: score ? "25.00" : "0.00" };
      try {
        const ai = await analyzeReportText(text);
        update = { ...update, ...ai, processingStatus: "NEEDS_MANUAL_REVIEW", manualReviewReason: "AI findings require administrator approval before use." };
      } catch (error) {
        req.log.warn({ err: error, reportId: report.id }, "AI analysis unavailable; manual review retained");
      }
    } catch { req.log.warn({ reportId: report.id }, "PDF extraction requires manual review"); }
  }
  const [updated] = await db.update(creditReportsTable).set(update).where(eq(creditReportsTable.id, report.id)).returning();
  req.log.warn({ reportId: report.id }, "Credit report queued for manual review");
  res.json(reportResponse(updated));
});
router.post("/credit-reports/:id/reprocess", async (req, res): Promise<void> => { req.params.id = req.params.id; const report = await ownedReport(req, safeId(req.params.id)); if (!report) { res.status(404).json({ error: "Report not found" }); return; } const [updated] = await db.update(creditReportsTable).set({ processingStatus: "NEEDS_MANUAL_REVIEW", manualReviewReason: "Reprocessing requires manual review." }).where(eq(creditReportsTable.id, report.id)).returning(); res.json(reportResponse(updated)); });
router.get("/credit-reports/:id/comparison/:otherId", async (req, res): Promise<void> => {
  const report = await ownedReport(req, safeId(req.params.id)); const other = await ownedReport(req, safeId(req.params.otherId));
  if (!report || !other || report.customerId !== other.customerId) { res.status(404).json({ error: "Comparable reports not found" }); return; }
  res.json({ reportId: report.id, otherReportId: other.id, scoreChange: report.score != null && other.score != null ? report.score - other.score : null, currentReport: reportResponse(report), comparedReport: reportResponse(other), disclaimer: "Comparison is informational and requires manual review; it does not guarantee score, loan, or dispute outcomes." });
});
router.patch("/admin/credit-reports/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req); const id = safeId(req.params.id);
  if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }
  const body = req.body as { analysis?: unknown; accounts?: unknown; factors?: unknown; flags?: unknown; summaries?: unknown; score?: number | null; reportDate?: string | null; version?: "ORIGINAL" | "UPDATED" | "RECTIFIED"; isCurrent?: boolean; manualReviewReason?: string | null };
  const [existing] = await db.select().from(creditReportsTable).where(eq(creditReportsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Report not found" }); return; }
  if (body.isCurrent) await db.update(creditReportsTable).set({ isCurrent: false }).where(eq(creditReportsTable.customerId, existing.customerId));
  const [updated] = await db.update(creditReportsTable).set({ ...body, reviewedById: admin.id, reviewedAt: new Date() }).where(eq(creditReportsTable.id, id)).returning();
  res.json(reportResponse(updated));
});
router.post("/admin/credit-reports/:id/approve", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req); if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }
  const [updated] = await db.update(creditReportsTable).set({ processingStatus: "PROCESSED", manualReviewReason: null, reviewedById: admin.id, reviewedAt: new Date(), adminReviewNotes: typeof req.body?.notes === "string" ? req.body.notes.slice(0, 2000) : null }).where(eq(creditReportsTable.id, safeId(req.params.id))).returning();
  if (!updated) { res.status(404).json({ error: "Report not found" }); return; } res.json(reportResponse(updated));
});
router.get("/admin/customers/:customerId/credit-reports", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req))) { res.status(403).json({ error: "Admin access required" }); return; }
  res.json((await db.select().from(creditReportsTable).where(eq(creditReportsTable.customerId, safeId(req.params.customerId))).orderBy(desc(creditReportsTable.createdAt))).map(reportResponse));
});

router.get("/quotes/current", async (req, res): Promise<void> => {
  const user = await currentUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [rule] = await db.select().from(pricingRulesTable).where(eq(pricingRulesTable.isActive, true)).limit(1);
  if (!rule) { res.status(404).json({ error: "No active pricing rule" }); return; }
  const [report] = await db.select().from(creditReportsTable).where(and(eq(creditReportsTable.customerId, user.id), eq(creditReportsTable.isCurrent, true), eq(creditReportsTable.processingStatus, "PROCESSED"))).limit(1);
  if (!report || !report.reviewedById || !Array.isArray(report.accounts) || !Array.isArray(report.factors) || !Array.isArray(report.flags)) { res.status(409).json({ error: "An administrator-approved report with validated findings is required before a quote can be generated." }); return; }
  const issueFees = (rule.issueFees as Record<string, number>) ?? {};
  const flagTypes = new Set((report.flags as Array<{ type?: string }>).map((flag) => flag.type).filter((type): type is string => typeof type === "string"));
  const items = [{ code: "BASE", amount: Number(rule.baseFee) }, ...Object.entries(issueFees).filter(([key]) => flagTypes.has(key)).map(([code, amount]) => ({ code, amount: Number(amount) }))];
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = rule.capFee == null ? subtotal : Math.min(subtotal, Number(rule.capFee));
  const [existingQuote] = await db.select().from(quoteSnapshotsTable).where(and(eq(quoteSnapshotsTable.customerId, user.id), eq(quoteSnapshotsTable.reportId, report.id), eq(quoteSnapshotsTable.pricingRuleId, rule.id))).limit(1);
  const quote = existingQuote ?? (await db.insert(quoteSnapshotsTable).values({ customerId: user.id, reportId: report.id, pricingRuleId: rule.id, items, total: total.toFixed(2) }).returning())[0];
  res.json({ ...quote, total: Number(quote.total), ruleVersion: rule.version });
});

router.get("/admin/pricing-rules", async (req, res): Promise<void> => { if (!(await requireAdmin(req))) { res.status(403).json({ error: "Admin access required" }); return; } res.json(await db.select().from(pricingRulesTable).orderBy(desc(pricingRulesTable.version))); });
router.post("/admin/pricing-rules", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req); const body = req.body as { name?: string; serviceInfo?: string | null; baseFee?: number; issueFees?: Record<string, number>; capFee?: number | null; isActive?: boolean };
  if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }
  if (!body.name || body.baseFee == null || !Number.isFinite(body.baseFee) || body.baseFee < 0 || !body.issueFees || Object.values(body.issueFees).some((fee) => !Number.isFinite(fee) || fee < 0)) { res.status(400).json({ error: "Valid deterministic pricing inputs are required" }); return; }
  const rows = await db.select({ version: pricingRulesTable.version }).from(pricingRulesTable).orderBy(desc(pricingRulesTable.version)).limit(1);
  if (body.isActive) await db.update(pricingRulesTable).set({ isActive: false }).where(eq(pricingRulesTable.isActive, true));
  const [rule] = await db.insert(pricingRulesTable).values({ version: (rows[0]?.version ?? 0) + 1, name: body.name, serviceInfo: body.serviceInfo?.slice(0, 2000) || null, baseFee: body.baseFee.toFixed(2), issueFees: body.issueFees, capFee: body.capFee == null ? null : body.capFee.toFixed(2), isActive: body.isActive ?? false, createdById: admin.id }).returning(); res.status(201).json(rule);
});
router.patch("/admin/pricing-rules/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req); const id = safeId(req.params.id); const body = req.body as { name?: string; serviceInfo?: string | null; baseFee?: number; issueFees?: Record<string, number>; capFee?: number | null; isActive?: boolean };
  if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }
  if (body.baseFee != null && (!Number.isFinite(body.baseFee) || body.baseFee < 0) || body.issueFees && Object.values(body.issueFees).some((fee) => !Number.isFinite(fee) || fee < 0) || body.capFee != null && (!Number.isFinite(body.capFee) || body.capFee < 0)) { res.status(400).json({ error: "Invalid pricing values" }); return; }
  if (body.isActive) await db.update(pricingRulesTable).set({ isActive: false }).where(eq(pricingRulesTable.isActive, true));
  const { baseFee, capFee, ...rest } = body;
  const update = { ...rest, ...(baseFee != null ? { baseFee: baseFee.toFixed(2) } : {}), ...(Object.prototype.hasOwnProperty.call(body, "capFee") ? { capFee: capFee == null ? null : capFee.toFixed(2) } : {}) };
  const [rule] = await db.update(pricingRulesTable).set(update).where(eq(pricingRulesTable.id, id)).returning();
  if (!rule) { res.status(404).json({ error: "Pricing rule not found" }); return; } res.json(rule);
});
router.delete("/admin/pricing-rules/:id", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req))) { res.status(403).json({ error: "Admin access required" }); return; }
  const id = safeId(req.params.id); const [snapshot] = await db.select({ id: quoteSnapshotsTable.id }).from(quoteSnapshotsTable).where(eq(quoteSnapshotsTable.pricingRuleId, id)).limit(1);
  if (snapshot) { const [rule] = await db.update(pricingRulesTable).set({ isActive: false }).where(eq(pricingRulesTable.id, id)).returning(); if (!rule) { res.status(404).json({ error: "Pricing rule not found" }); return; } res.json({ success: true, deactivated: true, message: "Referenced pricing rule was deactivated to preserve quote history." }); return; }
  const [deleted] = await db.delete(pricingRulesTable).where(eq(pricingRulesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Pricing rule not found" }); return; } res.json({ success: true, deactivated: false, message: "Pricing rule deleted." });
});

export default router;