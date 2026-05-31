import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateDocumentBody, UpdateDocumentBody, ListDocumentsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const parsed = ListDocumentsQueryParams.safeParse(req.query);
  if (!parsed.success || !parsed.data.caseId) {
    res.status(400).json({ error: "caseId required" });
    return;
  }
  const docs = await db.select().from(documentsTable)
    .where(eq(documentsTable.caseId, parsed.data.caseId))
    .orderBy(desc(documentsTable.createdAt));
  res.json(docs);
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db.insert(documentsTable).values(parsed.data).returning();
  res.status(201).json(doc);
});

router.patch("/documents/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = UpdateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db.update(documentsTable).set(parsed.data).where(eq(documentsTable.id, id)).returning();
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  res.json(doc);
});

export default router;
