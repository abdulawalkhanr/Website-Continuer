import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable, casesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListDocumentsQueryParams, CreateDocumentBody, UpdateDocumentParams, UpdateDocumentBody, DeleteDocumentParams
} from "@workspace/api-zod";

const router = Router();

type SessionReq = { session: Record<string, unknown> };
function getReqSession(req: object): Record<string, unknown> {
  return (req as unknown as SessionReq).session;
}

function getMimeType(fileName: string): string {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg", jpeg: "image/jpeg",
    png: "image/png", gif: "image/gif", webp: "image/webp",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] || "application/octet-stream";
}

// GET /documents/admin-all — admin only, all documents with case & customer info
router.get("/documents/admin-all", async (req, res): Promise<void> => {
  const userId = getReqSession(req).userId as number | undefined;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [adminUser] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!adminUser || adminUser.role === "CUSTOMER") { res.status(403).json({ error: "Forbidden" }); return; }

  const docs = await db
    .select({
      id: documentsTable.id,
      caseId: documentsTable.caseId,
      name: documentsTable.name,
      type: documentsTable.type,
      fileUrl: documentsTable.fileUrl,
      status: documentsTable.status,
      verifiedAt: documentsTable.verifiedAt,
      createdAt: documentsTable.createdAt,
      caseNumber: casesTable.caseNumber,
      customerName: usersTable.name,
      customerMobile: usersTable.mobile,
    })
    .from(documentsTable)
    .leftJoin(casesTable, eq(documentsTable.caseId, casesTable.id))
    .leftJoin(usersTable, eq(casesTable.customerId, usersTable.id))
    .orderBy(desc(documentsTable.createdAt));

  res.json(docs);
});

// GET /documents
router.get("/documents", async (req, res): Promise<void> => {
  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success || !parsed.data.caseId) { res.status(400).json({ error: "caseId is required" }); return; }
  const docs = await db.select().from(documentsTable)
    .where(eq(documentsTable.caseId, parsed.data.caseId))
    .orderBy(desc(documentsTable.createdAt));
  res.json(docs);
});

// POST /documents
router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "caseId, name, and type are required" }); return; }
  const { fileData, fileName, fileUrl: inputFileUrl, ...docData } = parsed.data as typeof parsed.data & { fileData?: string; fileName?: string };
  let fileUrl = inputFileUrl;
  if (fileData && !fileUrl) {
    const mime = getMimeType(fileName || "document");
    fileUrl = `data:${mime};base64,${fileData}`;
  }
  const status = (fileUrl || fileData) ? "UPLOADED" : "PENDING";
  const [doc] = await db.insert(documentsTable).values({ ...docData, fileUrl: fileUrl || null, status }).returning();
  res.status(201).json(doc);
});

// PATCH /documents/:id
router.patch("/documents/:id", async (req, res): Promise<void> => {
  const pParsed = UpdateDocumentParams.safeParse(req.params);
  if (!pParsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const bParsed = UpdateDocumentBody.safeParse(req.body);
  if (!bParsed.success) { res.status(400).json({ error: bParsed.error.message }); return; }
  const [doc] = await db.update(documentsTable).set(bParsed.data).where(eq(documentsTable.id, pParsed.data.id)).returning();
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  res.json(doc);
});

// DELETE /documents/:id
router.delete("/documents/:id", async (req, res): Promise<void> => {
  const pParsed = DeleteDocumentParams.safeParse(req.params);
  if (!pParsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(documentsTable).where(eq(documentsTable.id, pParsed.data.id));
  res.json({ success: true });
});

export default router;
