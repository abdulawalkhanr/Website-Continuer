import { Router } from "express";
import { db } from "@workspace/db";
import { referralsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateReferralBody, UpdateReferralBody } from "@workspace/api-zod";

const router = Router();

router.get("/referrals", async (req, res): Promise<void> => {
  const referrals = await db.select().from(referralsTable).orderBy(desc(referralsTable.createdAt));
  res.json(referrals.map(r => ({ ...r, rewardAmount: parseFloat(r.rewardAmount as string) })));
});

router.post("/referrals", async (req, res): Promise<void> => {
  const parsed = CreateReferralBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [referral] = await db.insert(referralsTable).values({
    ...data,
    rewardAmount: String(data.rewardAmount ?? 1000),
  }).returning();
  res.status(201).json({ ...referral, rewardAmount: parseFloat(referral.rewardAmount as string) });
});

router.patch("/referrals/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const parsed = UpdateReferralBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.rewardAmount !== undefined) {
    data.rewardAmount = String(parsed.data.rewardAmount);
  }
  const [referral] = await db.update(referralsTable).set(data).where(eq(referralsTable.id, id)).returning();
  if (!referral) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...referral, rewardAmount: parseFloat(referral.rewardAmount as string) });
});

export default router;
