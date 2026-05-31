import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, casesTable, leadsTable, paymentsTable, ticketsTable, referralsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/admin/dashboard", async (req, res): Promise<void> => {
  const [customers, cases, leads, payments, tickets, referrals] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.role, "CUSTOMER")),
    db.select().from(casesTable),
    db.select().from(leadsTable),
    db.select().from(paymentsTable),
    db.select().from(ticketsTable),
    db.select().from(referralsTable),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLeads = leads.filter(l => new Date(l.createdAt) >= today).length;
  const totalRevenue = payments.reduce((s, p) => s + parseFloat(p.serviceFee as string), 0);
  const collectedRevenue = payments.reduce((s, p) => s + parseFloat(p.advancePaid as string), 0);
  const pendingRevenue = totalRevenue - collectedRevenue;

  res.json({
    totalCustomers: customers.length,
    activeCases: cases.filter(c => c.status !== "COMPLETED").length,
    completedCases: cases.filter(c => c.status === "COMPLETED").length,
    pendingCases: cases.filter(c => c.status === "DOCUMENTS_SUBMITTED").length,
    totalRevenue,
    pendingRevenue,
    todayLeads,
    totalLeads: leads.length,
    openTickets: tickets.filter(t => t.status === "OPEN").length,
    pendingReferrals: referrals.filter(r => r.status === "PENDING").length,
  });
});

router.get("/admin/monthly-stats", async (req, res): Promise<void> => {
  const [leads, cases, payments] = await Promise.all([
    db.select().from(leadsTable),
    db.select().from(casesTable),
    db.select().from(paymentsTable),
  ]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const stats = months.slice(0, new Date().getMonth() + 1).map((month, idx) => {
    const mLeads = leads.filter(l => {
      const d = new Date(l.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    }).length;
    const mCases = cases.filter(c => {
      const d = new Date(c.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    }).length;
    const mRevenue = payments.filter(p => {
      const d = new Date(p.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    }).reduce((sum, p) => sum + parseFloat(p.advancePaid as string), 0);
    return { month, leads: mLeads, cases: mCases, revenue: mRevenue };
  });
  res.json(stats);
});

export default router;
