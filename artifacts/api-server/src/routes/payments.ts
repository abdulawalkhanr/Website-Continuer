import { Router } from "express";
import { db } from "@workspace/db";
import { paymentsTable, casesTable, usersTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { CreatePaymentBody, UpdatePaymentBody, ListPaymentsQueryParams } from "@workspace/api-zod";
import { getRequestUser, isAdmin, userOwnsCase } from "../lib/auth";

const router = Router();

router.get("/payments/stats", async (req, res): Promise<void> => {
  const all = await db.select().from(paymentsTable);
  const totalRevenue = all.reduce((sum, p) => sum + parseFloat(p.serviceFee as string), 0);
  const collectedRevenue = all.reduce((sum, p) => sum + parseFloat(p.advancePaid as string), 0);
  const pendingRevenue = totalRevenue - collectedRevenue;
  res.json({ totalRevenue, pendingRevenue, collectedRevenue, totalCases: all.length });
});

router.get("/payments", async (req, res): Promise<void> => {
  const parsed = ListPaymentsQueryParams.safeParse(req.query);
  const user = await getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  let payments;
  if (isAdmin(user.role)) {
    if (parsed.success && parsed.data.caseId) {
      payments = await db.select().from(paymentsTable)
        .where(eq(paymentsTable.caseId, parsed.data.caseId))
        .orderBy(desc(paymentsTable.createdAt));
    } else {
      payments = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.createdAt));
    }
  } else if (user.role === "CUSTOMER" && parsed.success && parsed.data.caseId) {
    if (!(await userOwnsCase(user.id, parsed.data.caseId))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    payments = await db.select().from(paymentsTable)
      .where(eq(paymentsTable.caseId, parsed.data.caseId))
      .orderBy(desc(paymentsTable.createdAt));
  } else if (user.role === "CUSTOMER") {
    const ownedCases = await db.select({ id: casesTable.id }).from(casesTable).where(eq(casesTable.customerId, user.id));
    payments = ownedCases.length
      ? await db.select().from(paymentsTable).where(inArray(paymentsTable.caseId, ownedCases.map(c => c.id))).orderBy(desc(paymentsTable.createdAt))
      : [];
  } else {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const enriched = await Promise.all(payments.map(async (p) => {
    const [c] = await db.select().from(casesTable).where(eq(casesTable.id, p.caseId)).limit(1);
    const [u] = c?.customerId ? await db.select().from(usersTable).where(eq(usersTable.id, c.customerId)).limit(1) : [undefined];
    return {
      ...p,
      caseNumber: c?.caseNumber || null,
      serviceType: c?.serviceType || null,
      customerName: u?.name || null,
      customerEmail: u?.email || null,
      customerMobile: u?.mobile || null,
      customerCity: u?.city || null,
      serviceFee: parseFloat(p.serviceFee as string),
      advancePaid: parseFloat(p.advancePaid as string),
      pendingAmount: parseFloat(p.pendingAmount as string),
    };
  }));
  res.json(enriched);
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { serviceFee, advancePaid = 0 } = parsed.data;
  const pendingAmount = serviceFee - advancePaid;
  const paymentStatus = advancePaid >= serviceFee ? "PAID" : advancePaid > 0 ? "PARTIAL" : "PENDING";
  const [payment] = await db.insert(paymentsTable).values({
    caseId: parsed.data.caseId,
    serviceFee: String(serviceFee),
    advancePaid: String(advancePaid),
    pendingAmount: String(pendingAmount),
    paymentStatus,
  }).returning();
  const [c] = await db.select().from(casesTable).where(eq(casesTable.id, payment.caseId)).limit(1);
  res.status(201).json({ ...payment, caseNumber: c?.caseNumber || null, serviceFee: parseFloat(payment.serviceFee as string), advancePaid: parseFloat(payment.advancePaid as string), pendingAmount: parseFloat(payment.pendingAmount as string) });
});

router.get("/payments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id)).limit(1);
  if (!payment) { res.status(404).json({ error: "Not found" }); return; }
  const user = await getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isAdmin(user.role) && (user.role !== "CUSTOMER" || !(await userOwnsCase(user.id, payment.caseId)))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [c] = await db.select().from(casesTable).where(eq(casesTable.id, payment.caseId)).limit(1);
  res.json({ ...payment, caseNumber: c?.caseNumber || null, serviceFee: parseFloat(payment.serviceFee as string), advancePaid: parseFloat(payment.advancePaid as string), pendingAmount: parseFloat(payment.pendingAmount as string) });
});

router.delete("/payments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [existing] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Payment not found" }); return; }
    await db.delete(paymentsTable).where(eq(paymentsTable.id, id));
    res.json({ success: true, message: "Payment record deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete payment");
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

router.patch("/payments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = UpdatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id)).limit(1);
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }
  
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.advancePaid !== undefined) {
    const serviceFee = parseFloat(existing[0].serviceFee as string);
    const adv = parsed.data.advancePaid;
    updateData.pendingAmount = String(serviceFee - adv);
    updateData.paymentStatus = adv >= serviceFee ? "PAID" : adv > 0 ? "PARTIAL" : "PENDING";
    updateData.advancePaid = String(adv);
  }
  const [payment] = await db.update(paymentsTable).set(updateData).where(eq(paymentsTable.id, id)).returning();
  const [c] = await db.select().from(casesTable).where(eq(casesTable.id, payment.caseId)).limit(1);
  res.json({ ...payment, caseNumber: c?.caseNumber || null, serviceFee: parseFloat(payment.serviceFee as string), advancePaid: parseFloat(payment.advancePaid as string), pendingAmount: parseFloat(payment.pendingAmount as string) });
});

export default router;
