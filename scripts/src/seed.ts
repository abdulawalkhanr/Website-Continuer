import { db } from "@workspace/db";
import * as schema from "@workspace/db";
import { createHash } from "crypto";

function hash(password: string) {
  return createHash("sha256").update(password + "cir_salt_2026").digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  const [admin] = await db.insert(schema.usersTable).values({
    email: "admin@circonsultationservice.site",
    passwordHash: hash("Admin@2026"),
    name: "CIR Admin",
    mobile: "9999999999",
    role: "OWNER",
  }).onConflictDoNothing().returning();
  console.log("Admin user:", admin?.email ?? "already exists");

  const [manager] = await db.insert(schema.usersTable).values({
    email: "manager@circonsultationservice.site",
    passwordHash: hash("Manager@2026"),
    name: "Priya Sharma",
    mobile: "9888888888",
    role: "MANAGER",
  }).onConflictDoNothing().returning();

  const [exec] = await db.insert(schema.usersTable).values({
    email: "exec@circonsultationservice.site",
    passwordHash: hash("Exec@2026"),
    name: "Rahul Verma",
    mobile: "9777777777",
    role: "EXECUTIVE",
  }).onConflictDoNothing().returning();

  const [customer] = await db.insert(schema.usersTable).values({
    email: "customer@example.com",
    passwordHash: hash("Customer@2026"),
    name: "Arjun Kapoor",
    mobile: "9876543210",
    role: "CUSTOMER",
  }).onConflictDoNothing().returning();
  console.log("Test customer:", customer?.email ?? "already exists");

  const leadCount = await db.select().from(schema.leadsTable);
  if (leadCount.length === 0) {
    await db.insert(schema.leadsTable).values([
      { name: "Sunita Verma", mobile: "9812345678", email: "sunita@example.com", city: "Delhi", serviceRequired: "CIBIL Rectification", stage: "NEW", source: "HOMEPAGE" },
      { name: "Mohammed Faiz", mobile: "9823456789", email: "faiz@example.com", city: "Mumbai", serviceRequired: "Settled Account", stage: "CONTACTED", source: "CHATBOT" },
      { name: "Kavita Singh", mobile: "9834567890", city: "Pune", serviceRequired: "Score Improvement", stage: "SCHEDULED", source: "REFERRAL" },
      { name: "Rohit Gupta", mobile: "9845678901", city: "Bangalore", serviceRequired: "Written Off Account", stage: "CONVERTED", source: "CONTACT" },
      { name: "Deepa Nair", mobile: "9856789012", city: "Chennai", serviceRequired: "Dispute Assistance", stage: "NEW", source: "HOMEPAGE" },
    ]);
    console.log("Seeded 5 leads");
  }

  if (customer) {
    const existingCases = await db.select().from(schema.casesTable);
    if (existingCases.length === 0) {
      const allUsers = await db.select().from(schema.usersTable);
      const execUser = exec ?? allUsers.find(u => u.role === "EXECUTIVE");

      const [caseRow] = await db.insert(schema.casesTable).values({
        caseNumber: "CIR-2026-1234",
        customerId: customer.id,
        assignedToId: execUser?.id ?? null,
        serviceType: "CIBIL Rectification - Written Off Account",
        status: "DISPUTE_SUBMITTED",
        progressPercentage: 60,
        notes: "Dispute submitted to CIBIL on May 20, 2026. Bureau response expected by June 20, 2026.",
        expectedCompletionDate: "July 15, 2026",
      }).returning();

      await db.insert(schema.documentsTable).values([
        { caseId: caseRow.id, name: "PAN Card - Arjun Kapoor", type: "PAN", status: "VERIFIED" },
        { caseId: caseRow.id, name: "Aadhaar Card", type: "AADHAAR", status: "VERIFIED" },
        { caseId: caseRow.id, name: "CIBIL Report May 2026", type: "CREDIT_REPORT", status: "VERIFIED" },
        { caseId: caseRow.id, name: "Bank Letter - Axis Bank", type: "NOC", status: "PENDING" },
      ]);

      await db.insert(schema.paymentsTable).values({
        caseId: caseRow.id,
        serviceFee: "4999",
        advancePaid: "2500",
        pendingAmount: "2499",
        paymentStatus: "PARTIAL",
      });

      await db.insert(schema.ticketsTable).values({
        customerId: customer.id,
        caseId: caseRow.id,
        subject: "Status update on dispute submission",
        description: "It has been 10 days since the dispute was filed. Could you please provide an update on the expected response from CIBIL?",
        status: "RESOLVED",
        response: "Dear Arjun, your dispute was submitted to CIBIL on May 20, 2026. The bureau typically takes 30-45 days. We will notify you via WhatsApp as soon as we receive a response. Expected by June 20, 2026.",
      });

      console.log("Seeded case, documents, payment, ticket for customer");
    }
  }

  const refCount = await db.select().from(schema.referralsTable);
  if (refCount.length === 0) {
    await db.insert(schema.referralsTable).values([
      { referrerName: "Priya Patel", referrerMobile: "9867543210", referrerEmail: "priya@example.com", referrerCity: "Mumbai", refereeName: "Suresh Kumar", refereeMobile: "9745632109", rewardAmount: "1000", status: "PENDING" },
      { referrerName: "Amit Shah", referrerMobile: "9756432198", referrerCity: "Delhi", refereeName: "Ravi Prasad", refereeMobile: "9634521087", rewardAmount: "2000", status: "APPROVED" },
    ]);
    console.log("Seeded 2 referrals");
  }

  console.log("\n=== SEED COMPLETE ===");
  console.log("Admin:    admin@circonsultationservice.site  / Admin@2026");
  console.log("Manager:  manager@circonsultationservice.site / Manager@2026");
  console.log("Customer: customer@example.com / Customer@2026");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
