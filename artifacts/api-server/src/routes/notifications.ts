import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  ListNotificationsQueryParams, CreateNotificationBody, UpdateNotificationParams,
  UpdateNotificationBody, MarkAllNotificationsReadBody
} from "@workspace/api-zod";

const router = Router();

// GET /notifications
router.get("/notifications", async (req, res): Promise<void> => {
  const parsed = ListNotificationsQueryParams.safeParse(req.query);
  let notifications;
  if (parsed.success && parsed.data.userId) {
    notifications = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, parsed.data.userId))
      .orderBy(desc(notificationsTable.createdAt));
  } else {
    notifications = await db.select().from(notificationsTable)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(100);
  }
  res.json(notifications);
});

// POST /notifications/mark-all-read (must be before /:id)
router.post("/notifications/mark-all-read", async (req, res): Promise<void> => {
  const parsed = MarkAllNotificationsReadBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  await db.update(notificationsTable).set({ isRead: true }).where(
    and(eq(notificationsTable.userId, parsed.data.userId), eq(notificationsTable.isRead, false))
  );
  res.json({ success: true });
});

// POST /notifications
router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [notification] = await db.insert(notificationsTable).values({
    userId: parsed.data.userId,
    title: parsed.data.title,
    message: parsed.data.message,
    type: (parsed.data.type as "CASE_UPDATE" | "DOCUMENT" | "PAYMENT" | "TICKET" | "GENERAL") ?? "GENERAL",
  }).returning();
  res.status(201).json(notification);
});

// PATCH /notifications/:id
router.patch("/notifications/:id", async (req, res): Promise<void> => {
  const pParsed = UpdateNotificationParams.safeParse(req.params);
  if (!pParsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const bParsed = UpdateNotificationBody.safeParse(req.body);
  if (!bParsed.success) { res.status(400).json({ error: bParsed.error.message }); return; }
  const [notification] = await db.update(notificationsTable).set(bParsed.data).where(eq(notificationsTable.id, pParsed.data.id)).returning();
  if (!notification) { res.status(404).json({ error: "Not found" }); return; }
  res.json(notification);
});

export default router;
