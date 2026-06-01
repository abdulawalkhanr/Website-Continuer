import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListDocumentsQueryParams, CreateDocumentBody, UpdateDocumentParams, UpdateDocumentBody, DeleteDocumentParams
} from "@workspace/api-zod";

const router = Router();

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
    fileUrl = `data:file;name=${encodeURIComponent(fileName || "document")};size=${fileData.length}`;
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
