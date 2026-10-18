import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  staffProfilesTable,
  staffAssignmentsTable,
  staffTasksTable,
  caseActivitiesTable,
  caseNotesTable,
  caseCommsTable,
  casesTable,
  documentsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, or, desc, sql, ilike, inArray } from "drizzle-orm";
import { createHash } from "crypto";
import {
  StaffLoginBody,
  CreateStaffBody,
  UpdateStaffBody,
  CreateStaffAssignmentBody,
  CreateStaffTaskBody,
  UpdateStaffTaskBody,
  UpdateStaffPortalTaskBody,
  UpdateStaffPortalCaseBody,
  CreateCaseNoteBody,
  CreateCaseCommBody,
  UpdateStaffPortalProfileBody,
} from "@workspace/api-zod";
import { hashPassword, verifyPassword, requireAdmin, requireStaff, requireAdminOrStaff, isAdmin } from "../lib/auth";
import { getSession, regenerateSession, revokeUserSessions } from "../lib/session";

const router = Router();

// ─── Helpers ───────────────────────────────────────────────────────────────

async function generateEmployeeId(): Promise<string> {
  const year = new Date().getFullYear();
  // Find the highest numeric suffix for this year safely
  const rows = await db
    .select({ employeeId: staffProfilesTable.employeeId })
    .from(staffProfilesTable)
    .where(ilike(staffProfilesTable.employeeId, `CIR-EMP-${year}-%`));
  let max = 0;
  for (const row of rows) {
    const parts = row.employeeId.split("-");
    const num = parseInt(parts[parts.length - 1] || "0", 10);
    if (!isNaN(num) && num > max) max = num;
  }
  return `CIR-EMP-${year}-${String(max + 1).padStart(4, "0")}`;
}

async function getStaffWorkload(staffId: number) {
  const [assignments, tasks] = await Promise.all([
    db.select().from(staffAssignmentsTable).where(
      and(eq(staffAssignmentsTable.staffId, staffId), eq(staffAssignmentsTable.isActive, true))
    ),
    db.select().from(staffTasksTable).where(eq(staffTasksTable.assigneeId, staffId)),
  ]);
  const assignedCaseIds = assignments.map(a => a.caseId);
  let completedCases = 0;
  if (assignedCaseIds.length > 0) {
    const allAssignments = await db.select().from(staffAssignmentsTable)
      .where(eq(staffAssignmentsTable.staffId, staffId));
    const caseIds = [...new Set(allAssignments.map(a => a.caseId))];
    if (caseIds.length > 0) {
      const caseRows = await db.select({ status: casesTable.status }).from(casesTable)
        .where(inArray(casesTable.id, caseIds));
      completedCases = caseRows.filter(c => c.status === "COMPLETED").length;
    }
  }
  return {
    activeAssignments: assignments.length,
    completedCases,
    pendingTasks: tasks.filter(t => t.status !== "COMPLETED").length,
    totalCases: assignedCaseIds.length,
  };
}

async function enrichAssignment(a: typeof staffAssignmentsTable.$inferSelect) {
  const [staffUser, caseRow] = await Promise.all([
    db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.staffId)).limit(1),
    db.select({ caseNumber: casesTable.caseNumber, customerId: casesTable.customerId }).from(casesTable).where(eq(casesTable.id, a.caseId)).limit(1),
  ]);
  let customerName: string | null = null;
  if (caseRow[0]) {
    const [cust] = await db.select({ name: usersTable.name }).from(usersTable)
      .where(eq(usersTable.id, caseRow[0].customerId)).limit(1);
    customerName = cust?.name ?? null;
  }
  return {
    ...a,
    staffName: staffUser[0]?.name ?? null,
    caseNumber: caseRow[0]?.caseNumber ?? null,
    customerName,
  };
}

async function enrichTask(t: typeof staffTasksTable.$inferSelect) {
  const [assignee] = await db.select({ name: usersTable.name }).from(usersTable)
    .where(eq(usersTable.id, t.assigneeId)).limit(1);
  return { ...t, assigneeName: assignee?.name ?? null };
}

async function enrichActivity(a: typeof caseActivitiesTable.$inferSelect) {
  let actorName: string | null = null;
  if (a.actorId) {
    const [actor] = await db.select({ name: usersTable.name }).from(usersTable)
      .where(eq(usersTable.id, a.actorId)).limit(1);
    actorName = actor?.name ?? null;
  }
  return { ...a, actorName };
}

async function enrichNote(n: typeof caseNotesTable.$inferSelect) {
  const [author] = await db.select({ name: usersTable.name }).from(usersTable)
    .where(eq(usersTable.id, n.authorId)).limit(1);
  return { ...n, authorName: author?.name ?? null };
}

async function enrichComm(c: typeof caseCommsTable.$inferSelect) {
  const [staff] = await db.select({ name: usersTable.name }).from(usersTable)
    .where(eq(usersTable.id, c.staffId)).limit(1);
  return { ...c, staffName: staff?.name ?? null };
}

async function checkStaffAssignedToCase(staffUserId: number, caseId: number): Promise<boolean> {
  const [assignment] = await db.select({ id: staffAssignmentsTable.id })
    .from(staffAssignmentsTable)
    .where(and(
      eq(staffAssignmentsTable.staffId, staffUserId),
      eq(staffAssignmentsTable.caseId, caseId),
      eq(staffAssignmentsTable.isActive, true),
    ))
    .limit(1);
  return !!assignment;
}

async function notifyAdmins(title: string, message: string) {
  const admins = await db.select({ id: usersTable.id }).from(usersTable)
    .where(or(
      eq(usersTable.role, "OWNER"),
      eq(usersTable.role, "MANAGER"),
      eq(usersTable.role, "EXECUTIVE"),
    ));
  await Promise.all(admins.map(a =>
    db.insert(notificationsTable).values({ userId: a.id, title, message, type: "CASE_UPDATE" }).catch(() => {})
  ));
}

// ─── Staff Login ────────────────────────────────────────────────────────────

// POST /auth/staff/login
router.post("/auth/staff/login", async (req, res): Promise<void> => {
  const parsed = StaffLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "identifier and password are required" });
    return;
  }
  const { identifier, password } = parsed.data;
  const identifierTrimmed = identifier.trim().toLowerCase();

  // Find STAFF user by employeeId, email, or mobile
  // First check by email or mobile on usersTable
  const usersByContact = await db.select().from(usersTable)
    .where(or(
      eq(usersTable.email, identifierTrimmed),
      eq(usersTable.mobile, identifier.trim()),
    ))
    .limit(5);

  // Also check via employee ID by joining staff_profiles
  const profileByEmpId = await db.select({
    userId: staffProfilesTable.userId,
    employeeId: staffProfilesTable.employeeId,
    accountStatus: staffProfilesTable.accountStatus,
  })
    .from(staffProfilesTable)
    .where(eq(staffProfilesTable.employeeId, identifier.trim().toUpperCase()))
    .limit(1);

  let candidateUser: typeof usersTable.$inferSelect | null = null;
  let staffProfile: typeof staffProfilesTable.$inferSelect | null = null;

  if (profileByEmpId.length > 0) {
    const [u] = await db.select().from(usersTable)
      .where(eq(usersTable.id, profileByEmpId[0].userId)).limit(1);
    candidateUser = u ?? null;
  } else {
    for (const u of usersByContact) {
      if (u.role === "STAFF") {
        candidateUser = u;
        break;
      }
    }
  }

  if (!candidateUser || candidateUser.role !== "STAFF") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const passwordVerification = await verifyPassword(password, candidateUser.passwordHash);
  if (!passwordVerification.valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (passwordVerification.needsUpgrade) {
    await db.update(usersTable).set({ passwordHash: await hashPassword(password) }).where(eq(usersTable.id, candidateUser.id));
  }

  // Load profile
  const [profile] = await db.select().from(staffProfilesTable)
    .where(eq(staffProfilesTable.userId, candidateUser.id)).limit(1);

  if (!profile) {
    res.status(401).json({ error: "Staff profile not found" });
    return;
  }

  if (profile.accountStatus !== "ACTIVE") {
    res.status(401).json({ error: `Account is ${profile.accountStatus.toLowerCase()}. Please contact your administrator.` });
    return;
  }

  staffProfile = profile;
  const { passwordHash: _, ...safeUser } = candidateUser;
  await regenerateSession(req);
  getSession(req).userId = candidateUser.id;
  res.json({ user: safeUser, staffProfile });
});

// ─── Admin Staff Management ────────────────────────────────────────────────

// GET /staff
router.get("/staff", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const { search, status } = req.query as { search?: string; status?: string };

  const profiles = await db.select().from(staffProfilesTable)
    .where(status ? eq(staffProfilesTable.accountStatus, status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED") : undefined)
    .orderBy(desc(staffProfilesTable.createdAt));

  const userIds = profiles.map(p => p.userId);
  if (userIds.length === 0) { res.json([]); return; }

  const users = await db.select().from(usersTable).where(inArray(usersTable.id, userIds));
  const userMap = new Map(users.map(u => [u.id, u]));

  let result = profiles.map(p => {
    const u = userMap.get(p.userId);
    if (!u) return null;
    return { profile: p, user: u };
  }).filter(Boolean) as { profile: typeof staffProfilesTable.$inferSelect; user: typeof usersTable.$inferSelect }[];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(r =>
      r.user.name.toLowerCase().includes(q) ||
      r.user.email.toLowerCase().includes(q) ||
      r.profile.employeeId.toLowerCase().includes(q) ||
      (r.profile.designation?.toLowerCase().includes(q) ?? false) ||
      (r.profile.department?.toLowerCase().includes(q) ?? false)
    );
  }

  const summaries = await Promise.all(result.map(async r => {
    const workload = await getStaffWorkload(r.user.id);
    return {
      id: r.profile.id,
      userId: r.user.id,
      employeeId: r.profile.employeeId,
      name: r.user.name,
      email: r.user.email,
      mobile: r.user.mobile,
      designation: r.profile.designation,
      department: r.profile.department,
      profilePhotoUrl: r.profile.profilePhotoUrl,
      accountStatus: r.profile.accountStatus,
      employmentStatus: r.profile.employmentStatus,
      activeAssignments: workload.activeAssignments,
      completedCases: workload.completedCases,
      pendingTasks: workload.pendingTasks,
      createdAt: r.profile.createdAt.toISOString(),
    };
  }));

  res.json(summaries);
});

// POST /staff
router.post("/staff", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = CreateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, mobile, designation, department, staffRole, address, joiningDate, employmentStatus, permissions, profilePhotoUrl, emergencyContactName, emergencyContactMobile, allowMobileDisplay } = parsed.data;
  if (password.length < 12) { res.status(400).json({ error: "Password must be at least 12 characters long." }); return; }

  const emailNorm = email.toLowerCase().trim();
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.email, emailNorm)).limit(1);
  if (existing) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const employeeId = await generateEmployeeId();
  const passwordHash = await hashPassword(password);

  const [newUser] = await db.insert(usersTable).values({
    name,
    email: emailNorm,
    mobile: mobile ?? null,
    passwordHash,
    role: "STAFF",
  }).returning();

  const [newProfile] = await db.insert(staffProfilesTable).values({
    userId: newUser.id,
    employeeId,
    designation: designation ?? null,
    department: department ?? null,
    staffRole: staffRole ?? null,
    address: address ?? null,
    joiningDate: joiningDate ?? null,
    employmentStatus: employmentStatus ?? "FULL_TIME",
    permissions: permissions ?? [],
    profilePhotoUrl: profilePhotoUrl ?? null,
    emergencyContactName: emergencyContactName ?? null,
    emergencyContactMobile: emergencyContactMobile ?? null,
    allowMobileDisplay: allowMobileDisplay ?? false,
    accountStatus: "ACTIVE",
  }).returning();

  const { passwordHash: _, ...safeUser } = newUser;
  const workload = await getStaffWorkload(newUser.id);

  res.status(201).json({
    user: safeUser,
    profile: newProfile,
    ...workload,
  });
});

// GET /staff/performance
router.get("/staff/performance", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const profiles = await db.select().from(staffProfilesTable);
  const userIds = profiles.map(p => p.userId);
  if (userIds.length === 0) { res.json([]); return; }
  const users = await db.select().from(usersTable).where(inArray(usersTable.id, userIds));
  const userMap = new Map(users.map(u => [u.id, u]));

  const performance = await Promise.all(profiles.map(async p => {
    const u = userMap.get(p.userId);
    if (!u) return null;

    const [allAssignments, tasks] = await Promise.all([
      db.select().from(staffAssignmentsTable).where(eq(staffAssignmentsTable.staffId, u.id)),
      db.select().from(staffTasksTable).where(eq(staffTasksTable.assigneeId, u.id)),
    ]);

    const caseIds = [...new Set(allAssignments.map(a => a.caseId))];
    let completedCases = 0;
    let activeCases = 0;
    if (caseIds.length > 0) {
      const caseRows = await db.select({ status: casesTable.status }).from(casesTable)
        .where(inArray(casesTable.id, caseIds));
      completedCases = caseRows.filter(c => c.status === "COMPLETED").length;
      activeCases = caseRows.filter(c => c.status !== "COMPLETED").length;
    }

    return {
      staffId: p.id,
      userId: u.id,
      employeeId: p.employeeId,
      name: u.name,
      designation: p.designation,
      totalAssigned: caseIds.length,
      activeCases,
      completedCases,
      pendingTasks: tasks.filter(t => t.status !== "COMPLETED").length,
      completedTasks: tasks.filter(t => t.status === "COMPLETED").length,
    };
  }));

  res.json(performance.filter(Boolean));
});

// POST /staff/assignments
router.post("/staff/assignments", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = CreateStaffAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { caseId, staffId, priority, dueDate } = parsed.data;

  // Verify staff exists and is STAFF role
  const [staffUser] = await db.select().from(usersTable)
    .where(and(eq(usersTable.id, staffId), eq(usersTable.role, "STAFF"))).limit(1);
  if (!staffUser) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  // Verify case exists
  const [caseRow] = await db.select().from(casesTable).where(eq(casesTable.id, caseId)).limit(1);
  if (!caseRow) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  // Check for duplicate active assignment
  const [existing] = await db.select({ id: staffAssignmentsTable.id })
    .from(staffAssignmentsTable)
    .where(and(
      eq(staffAssignmentsTable.caseId, caseId),
      eq(staffAssignmentsTable.staffId, staffId),
      eq(staffAssignmentsTable.isActive, true),
    )).limit(1);

  if (existing) {
    res.status(409).json({ error: "Staff member is already actively assigned to this case" });
    return;
  }

  const [assignment] = await db.insert(staffAssignmentsTable).values({
    caseId,
    staffId,
    priority: priority ?? "MEDIUM",
    dueDate: dueDate ?? null,
    createdById: admin.id,
    isActive: true,
  }).returning();

  // Update cases.assignedToId if not set (primary staff for admin UI)
  if (!caseRow.assignedToId) {
    await db.update(casesTable).set({ assignedToId: staffId }).where(eq(casesTable.id, caseId));
  }

  // Notify staff
  await db.insert(notificationsTable).values({
    userId: staffId,
    title: "New Case Assigned",
    message: `Case ${caseRow.caseNumber} has been assigned to you with ${priority ?? "MEDIUM"} priority.`,
    type: "CASE_UPDATE",
  }).catch(() => {});

  const enriched = await enrichAssignment(assignment);
  res.status(201).json(enriched);
});

// DELETE /staff/assignments/:id
router.delete("/staff/assignments/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [assignment] = await db.update(staffAssignmentsTable)
    .set({ isActive: false })
    .where(eq(staffAssignmentsTable.id, id))
    .returning();

  if (!assignment) {
    res.status(404).json({ error: "Assignment not found" });
    return;
  }

  res.json({ success: true, message: "Assignment removed" });
});

// GET /staff/tasks
router.get("/staff/tasks", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const tasks = await db.select().from(staffTasksTable).orderBy(desc(staffTasksTable.createdAt));
  const enriched = await Promise.all(tasks.map(enrichTask));
  res.json(enriched);
});

// POST /staff/tasks
router.post("/staff/tasks", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = CreateStaffTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, relatedCustomerId, relatedCaseId, assigneeId, priority, dueDate } = parsed.data;

  const [assignee] = await db.select().from(usersTable).where(eq(usersTable.id, assigneeId)).limit(1);
  if (!assignee) {
    res.status(404).json({ error: "Assignee not found" });
    return;
  }

  const [task] = await db.insert(staffTasksTable).values({
    title,
    description: description ?? null,
    relatedCustomerId: relatedCustomerId ?? null,
    relatedCaseId: relatedCaseId ?? null,
    assigneeId,
    createdById: admin.id,
    priority: priority ?? "MEDIUM",
    dueDate: dueDate ?? null,
    status: "NOT_STARTED",
  }).returning();

  // Notify assignee
  await db.insert(notificationsTable).values({
    userId: assigneeId,
    title: "New Task Assigned",
    message: `You have a new task: ${title}`,
    type: "GENERAL",
  }).catch(() => {});

  const enriched = await enrichTask(task);
  res.status(201).json(enriched);
});

// PATCH /staff/tasks/:id
router.patch("/staff/tasks/:id", async (req, res): Promise<void> => {
  const user = await requireAdminOrStaff(req);
  if (!user) { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [task] = await db.select().from(staffTasksTable).where(eq(staffTasksTable.id, id)).limit(1);
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  if (!isAdmin(user.role)) {
    // Staff can only update own tasks and only update status
    if (task.assigneeId !== user.id) {
      res.status(403).json({ error: "You can only update your own tasks" });
      return;
    }
    const parsed = UpdateStaffPortalTaskBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [updated] = await db.update(staffTasksTable)
      .set({ status: parsed.data.status })
      .where(eq(staffTasksTable.id, id))
      .returning();
    const enriched = await enrichTask(updated);
    res.json(enriched);
    return;
  }

  const parsed = UpdateStaffTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof staffTasksTable.$inferInsert> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.relatedCustomerId !== undefined) updateData.relatedCustomerId = parsed.data.relatedCustomerId;
  if (parsed.data.relatedCaseId !== undefined) updateData.relatedCaseId = parsed.data.relatedCaseId;
  if (parsed.data.assigneeId !== undefined) updateData.assigneeId = parsed.data.assigneeId;

  const [updated] = await db.update(staffTasksTable).set(updateData).where(eq(staffTasksTable.id, id)).returning();
  const enriched = await enrichTask(updated);
  res.json(enriched);
});

// GET /staff/activities
router.get("/staff/activities", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const { staffId, caseId } = req.query as { staffId?: string; caseId?: string };
  const conditions = [];
  if (staffId) conditions.push(eq(caseActivitiesTable.actorId, parseInt(staffId, 10)));
  if (caseId) conditions.push(eq(caseActivitiesTable.caseId, parseInt(caseId, 10)));

  const activities = conditions.length > 0
    ? await db.select().from(caseActivitiesTable).where(and(...conditions)).orderBy(desc(caseActivitiesTable.createdAt)).limit(100)
    : await db.select().from(caseActivitiesTable).orderBy(desc(caseActivitiesTable.createdAt)).limit(100);

  const enriched = await Promise.all(activities.map(enrichActivity));
  res.json(enriched);
});

// GET /staff/id-card/:id — must come before /staff/:id
router.get("/staff/id-card/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [profile] = await db.select().from(staffProfilesTable).where(eq(staffProfilesTable.id, id)).limit(1);
  if (!profile) { res.status(404).json({ error: "Staff not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Staff user not found" }); return; }

  // Deterministic verification code from employeeId (no sensitive data)
  const verificationCode = createHash("sha256").update(profile.employeeId + "cir_id_verify").digest("hex").slice(0, 12).toUpperCase();

  res.json({
    employeeId: profile.employeeId,
    name: user.name,
    email: user.email,
    mobile: profile.allowMobileDisplay ? user.mobile : null,
    designation: profile.designation,
    department: profile.department,
    joiningDate: profile.joiningDate,
    profilePhotoUrl: profile.profilePhotoUrl,
    accountStatus: profile.accountStatus,
    allowMobileDisplay: profile.allowMobileDisplay,
    verificationCode,
  });
});

// GET /staff/:id/assignments — must come before /staff/:id
router.get("/staff/:id/assignments", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [profile] = await db.select().from(staffProfilesTable).where(eq(staffProfilesTable.id, id)).limit(1);
  if (!profile) { res.status(404).json({ error: "Staff not found" }); return; }

  const assignments = await db.select().from(staffAssignmentsTable)
    .where(eq(staffAssignmentsTable.staffId, profile.userId))
    .orderBy(desc(staffAssignmentsTable.createdAt));

  const enriched = await Promise.all(assignments.map(enrichAssignment));
  res.json(enriched);
});

// GET /staff/:id
router.get("/staff/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [profile] = await db.select().from(staffProfilesTable).where(eq(staffProfilesTable.id, id)).limit(1);
  if (!profile) { res.status(404).json({ error: "Staff not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, profile.userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Staff user not found" }); return; }

  const workload = await getStaffWorkload(user.id);
  const { passwordHash: _, ...safeUser } = user;

  res.json({ user: safeUser, profile, ...workload });
});

// PATCH /staff/:id
router.patch("/staff/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = UpdateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [profile] = await db.select().from(staffProfilesTable).where(eq(staffProfilesTable.id, id)).limit(1);
  if (!profile) { res.status(404).json({ error: "Staff not found" }); return; }

  const { name, email, mobile, password, accountStatus, designation, department, staffRole, address, joiningDate, employmentStatus, permissions, profilePhotoUrl, emergencyContactName, emergencyContactMobile, allowMobileDisplay } = parsed.data;

  // Update user record
  const userUpdateData: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) userUpdateData.name = name;
  if (email !== undefined) userUpdateData.email = email.toLowerCase().trim();
  if (mobile !== undefined) userUpdateData.mobile = mobile;
  if (password !== undefined) {
    if (password.length < 12) { res.status(400).json({ error: "Password must be at least 12 characters long." }); return; }
    userUpdateData.passwordHash = await hashPassword(password);
  }

  if (Object.keys(userUpdateData).length > 0) {
    await db.update(usersTable).set(userUpdateData).where(eq(usersTable.id, profile.userId));
  }
  if (password !== undefined) await revokeUserSessions(profile.userId);

  // Update profile record
  const profileUpdateData: Partial<typeof staffProfilesTable.$inferInsert> = {};
  if (designation !== undefined) profileUpdateData.designation = designation;
  if (department !== undefined) profileUpdateData.department = department;
  if (staffRole !== undefined) profileUpdateData.staffRole = staffRole;
  if (address !== undefined) profileUpdateData.address = address;
  if (joiningDate !== undefined) profileUpdateData.joiningDate = joiningDate;
  if (employmentStatus !== undefined) profileUpdateData.employmentStatus = employmentStatus;
  if (accountStatus !== undefined) profileUpdateData.accountStatus = accountStatus;
  if (permissions !== undefined) profileUpdateData.permissions = permissions;
  if (profilePhotoUrl !== undefined) profileUpdateData.profilePhotoUrl = profilePhotoUrl;
  if (emergencyContactName !== undefined) profileUpdateData.emergencyContactName = emergencyContactName;
  if (emergencyContactMobile !== undefined) profileUpdateData.emergencyContactMobile = emergencyContactMobile;
  if (allowMobileDisplay !== undefined) profileUpdateData.allowMobileDisplay = allowMobileDisplay;

  const [updatedProfile] = Object.keys(profileUpdateData).length > 0
    ? await db.update(staffProfilesTable).set(profileUpdateData).where(eq(staffProfilesTable.id, id)).returning()
    : [profile];
  if (accountStatus && accountStatus !== "ACTIVE") await revokeUserSessions(profile.userId);

  const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, profile.userId)).limit(1);
  const workload = await getStaffWorkload(updatedUser.id);
  const { passwordHash: _, ...safeUser } = updatedUser;

  res.json({ user: safeUser, profile: updatedProfile, ...workload });
});

// DELETE /staff/:id (archive)
router.delete("/staff/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [profile] = await db.select().from(staffProfilesTable).where(eq(staffProfilesTable.id, id)).limit(1);
  if (!profile) { res.status(404).json({ error: "Staff not found" }); return; }

  await db.update(staffProfilesTable)
    .set({ accountStatus: "ARCHIVED" })
    .where(eq(staffProfilesTable.id, id));
  await revokeUserSessions(profile.userId);

  // Deactivate all assignments
  await db.update(staffAssignmentsTable)
    .set({ isActive: false })
    .where(eq(staffAssignmentsTable.staffId, profile.userId));

  res.json({ success: true, message: "Staff member archived" });
});

// ─── Staff Portal ─────────────────────────────────────────────────────────

// GET /staff/portal/dashboard
router.get("/staff/portal/dashboard", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const assignments = await db.select().from(staffAssignmentsTable)
    .where(and(eq(staffAssignmentsTable.staffId, staff.id), eq(staffAssignmentsTable.isActive, true)))
    .orderBy(desc(staffAssignmentsTable.createdAt));

  const tasks = await db.select().from(staffTasksTable)
    .where(eq(staffTasksTable.assigneeId, staff.id));

  const caseIds = [...new Set(assignments.map(a => a.caseId))];
  let activeCases = 0;
  let completedCases = 0;
  const clientIds = new Set<number>();

  if (caseIds.length > 0) {
    const caseRows = await db.select().from(casesTable).where(inArray(casesTable.id, caseIds));
    activeCases = caseRows.filter(c => c.status !== "COMPLETED").length;
    completedCases = caseRows.filter(c => c.status === "COMPLETED").length;
    caseRows.forEach(c => clientIds.add(c.customerId));
  }

  // Recent activity (last 10)
  const recentActivities = caseIds.length > 0
    ? await db.select().from(caseActivitiesTable)
        .where(inArray(caseActivitiesTable.caseId, caseIds))
        .orderBy(desc(caseActivitiesTable.createdAt))
        .limit(10)
    : [];

  const enrichedActivities = await Promise.all(recentActivities.map(enrichActivity));

  // New assignments (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newAssignments = assignments.filter(a => new Date(a.createdAt) >= sevenDaysAgo).length;

  // Upcoming deadlines (assignments with dueDate in future)
  const upcomingDeadlines = assignments
    .filter(a => a.dueDate && new Date(a.dueDate) >= new Date())
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
    .slice(0, 5);

  const enrichedDeadlines = await Promise.all(upcomingDeadlines.map(enrichAssignment));

  res.json({
    activeCases,
    completedCases,
    pendingTasks: tasks.filter(t => t.status !== "COMPLETED").length,
    totalClients: clientIds.size,
    newAssignments,
    recentActivity: enrichedActivities,
    upcomingDeadlines: enrichedDeadlines,
  });
});

// GET /staff/portal/cases
router.get("/staff/portal/cases", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const { q, status, priority } = req.query as { q?: string; status?: string; priority?: string };

  const assignmentConditions = [
    eq(staffAssignmentsTable.staffId, staff.id),
    eq(staffAssignmentsTable.isActive, true),
  ];
  if (priority) assignmentConditions.push(eq(staffAssignmentsTable.priority, priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT"));

  const assignments = await db.select().from(staffAssignmentsTable)
    .where(and(...assignmentConditions));

  if (assignments.length === 0) { res.json([]); return; }

  const caseIds = assignments.map(a => a.caseId);
  const caseConditions = [inArray(casesTable.id, caseIds)];
  if (status) caseConditions.push(eq(casesTable.status, status as "DOCUMENTS_SUBMITTED" | "CASE_REVIEW" | "DOCUMENTATION_VERIFIED" | "DISPUTE_SUBMITTED" | "BUREAU_LENDER_REVIEW" | "FOLLOW_UP" | "COMPLETED"));

  const cases = await db.select().from(casesTable).where(and(...caseConditions));

  // Enrich with customer data
  const customerIds = [...new Set(cases.map(c => c.customerId))];
  const customers = customerIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, customerIds))
    : [];
  const customerMap = new Map(customers.map(c => [c.id, c]));
  const assignmentMap = new Map(assignments.map(a => [a.caseId, a]));

  let result = cases.map(c => {
    const customer = customerMap.get(c.customerId);
    const assignment = assignmentMap.get(c.id);
    return {
      ...c,
      customerName: customer?.name ?? null,
      customerMobile: customer?.mobile ?? null,
      assignmentPriority: assignment?.priority ?? "MEDIUM",
      assignmentDueDate: assignment?.dueDate ?? null,
      assignmentId: assignment?.id ?? 0,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  if (q) {
    const ql = q.toLowerCase();
    result = result.filter(r =>
      r.caseNumber.toLowerCase().includes(ql) ||
      (r.customerName?.toLowerCase().includes(ql) ?? false) ||
      r.serviceType.toLowerCase().includes(ql)
    );
  }

  res.json(result);
});

// GET /staff/portal/cases/:caseId
router.get("/staff/portal/cases/:caseId", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const caseId = parseInt(Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId, 10);
  if (isNaN(caseId)) { res.status(400).json({ error: "Invalid case ID" }); return; }

  const assigned = await checkStaffAssignedToCase(staff.id, caseId);
  if (!assigned) { res.status(403).json({ error: "You are not assigned to this case" }); return; }

  const [caseRow] = await db.select().from(casesTable).where(eq(casesTable.id, caseId)).limit(1);
  if (!caseRow) { res.status(404).json({ error: "Case not found" }); return; }

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, caseRow.customerId)).limit(1);

  const [assignment] = await db.select().from(staffAssignmentsTable)
    .where(and(
      eq(staffAssignmentsTable.caseId, caseId),
      eq(staffAssignmentsTable.staffId, staff.id),
      eq(staffAssignmentsTable.isActive, true),
    )).limit(1);

  const [documents, tasks, notes, activities, communications] = await Promise.all([
    db.select().from(documentsTable).where(eq(documentsTable.caseId, caseId)),
    db.select().from(staffTasksTable).where(eq(staffTasksTable.relatedCaseId, caseId)),
    db.select().from(caseNotesTable).where(eq(caseNotesTable.caseId, caseId)).orderBy(desc(caseNotesTable.createdAt)),
    db.select().from(caseActivitiesTable).where(eq(caseActivitiesTable.caseId, caseId)).orderBy(desc(caseActivitiesTable.createdAt)),
    db.select().from(caseCommsTable).where(eq(caseCommsTable.caseId, caseId)).orderBy(desc(caseCommsTable.createdAt)),
  ]);

  const [enrichedAssignment, enrichedNotes, enrichedActivities, enrichedComms, enrichedTasks] = await Promise.all([
    assignment ? enrichAssignment(assignment) : Promise.resolve(null),
    Promise.all(notes.map(enrichNote)),
    Promise.all(activities.map(enrichActivity)),
    Promise.all(communications.map(enrichComm)),
    Promise.all(tasks.map(enrichTask)),
  ]);

  const assignedTo = caseRow.assignedToId
    ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, caseRow.assignedToId)).limit(1))[0]
    : null;

  res.json({
    case: {
      ...caseRow,
      customerName: customer?.name ?? null,
      customerMobile: customer?.mobile ?? null,
      assignedToName: assignedTo?.name ?? null,
      createdAt: caseRow.createdAt.toISOString(),
      updatedAt: caseRow.updatedAt.toISOString(),
    },
    customer: customer ? {
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
    } : null,
    assignment: enrichedAssignment,
    documents,
    tasks: enrichedTasks,
    notes: enrichedNotes,
    activities: enrichedActivities,
    communications: enrichedComms,
  });
});

// PATCH /staff/portal/cases/:caseId
router.patch("/staff/portal/cases/:caseId", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const caseId = parseInt(Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId, 10);
  if (isNaN(caseId)) { res.status(400).json({ error: "Invalid case ID" }); return; }

  const assigned = await checkStaffAssignedToCase(staff.id, caseId);
  if (!assigned) { res.status(403).json({ error: "You are not assigned to this case" }); return; }

  const parsed = UpdateStaffPortalCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [oldCase] = await db.select().from(casesTable).where(eq(casesTable.id, caseId)).limit(1);
  if (!oldCase) { res.status(404).json({ error: "Case not found" }); return; }

  const updateData: Partial<typeof casesTable.$inferInsert> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.progressPercentage !== undefined) updateData.progressPercentage = parsed.data.progressPercentage;

  const [updatedCase] = await db.update(casesTable).set(updateData).where(eq(casesTable.id, caseId)).returning();

  // Log activity
  await db.insert(caseActivitiesTable).values({
    caseId,
    actorId: staff.id,
    action: "CASE_UPDATED",
    previousStatus: oldCase.status,
    newStatus: updatedCase.status,
    previousProgress: oldCase.progressPercentage,
    newProgress: updatedCase.progressPercentage,
    summary: parsed.data.summary ?? null,
  }).catch(err => req.log.error({ err }, "Failed to log case activity"));

  // Notify admins
  await notifyAdmins(
    "Case Updated by Staff",
    `Case ${updatedCase.caseNumber} updated: ${updatedCase.status}${parsed.data.summary ? ` - ${parsed.data.summary}` : ""}`,
  );

  // Notify customer if status changed
  if (parsed.data.status && parsed.data.status !== oldCase.status) {
    const statusLabel = parsed.data.status.replace(/_/g, " ");
    await db.insert(notificationsTable).values({
      userId: updatedCase.customerId,
      title: "Case Status Updated",
      message: `Your case ${updatedCase.caseNumber} status: ${statusLabel}.`,
      type: "CASE_UPDATE",
    }).catch(() => {});
  }

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, updatedCase.customerId)).limit(1);
  const assignedTo = updatedCase.assignedToId
    ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updatedCase.assignedToId)).limit(1))[0]
    : null;

  res.json({
    ...updatedCase,
    customerName: customer?.name ?? null,
    customerMobile: customer?.mobile ?? null,
    assignedToName: assignedTo?.name ?? null,
    createdAt: updatedCase.createdAt.toISOString(),
    updatedAt: updatedCase.updatedAt.toISOString(),
  });
});

// POST /staff/portal/cases/:caseId/notes
router.post("/staff/portal/cases/:caseId/notes", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const caseId = parseInt(Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId, 10);
  if (isNaN(caseId)) { res.status(400).json({ error: "Invalid case ID" }); return; }

  const assigned = await checkStaffAssignedToCase(staff.id, caseId);
  if (!assigned) { res.status(403).json({ error: "You are not assigned to this case" }); return; }

  const parsed = CreateCaseNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [note] = await db.insert(caseNotesTable).values({
    caseId,
    authorId: staff.id,
    note: parsed.data.note,
  }).returning();

  // Log activity
  const [caseRow] = await db.select({ caseNumber: casesTable.caseNumber }).from(casesTable).where(eq(casesTable.id, caseId)).limit(1);
  await db.insert(caseActivitiesTable).values({
    caseId,
    actorId: staff.id,
    action: "NOTE_ADDED",
    summary: `Note added: ${parsed.data.note.slice(0, 80)}`,
  }).catch(() => {});

  const enriched = await enrichNote(note);
  res.status(201).json(enriched);
});

// POST /staff/portal/cases/:caseId/communications
router.post("/staff/portal/cases/:caseId/communications", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const caseId = parseInt(Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId, 10);
  if (isNaN(caseId)) { res.status(400).json({ error: "Invalid case ID" }); return; }

  const assigned = await checkStaffAssignedToCase(staff.id, caseId);
  if (!assigned) { res.status(403).json({ error: "You are not assigned to this case" }); return; }

  const parsed = CreateCaseCommBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [comm] = await db.insert(caseCommsTable).values({
    caseId,
    staffId: staff.id,
    type: parsed.data.type,
    note: parsed.data.note ?? null,
    nextFollowUpDate: parsed.data.nextFollowUpDate ?? null,
  }).returning();

  // Log activity
  await db.insert(caseActivitiesTable).values({
    caseId,
    actorId: staff.id,
    action: `COMMUNICATION_${parsed.data.type}`,
    summary: parsed.data.note ? parsed.data.note.slice(0, 100) : parsed.data.type.replace(/_/g, " "),
  }).catch(() => {});

  const enriched = await enrichComm(comm);
  res.status(201).json(enriched);
});

// GET /staff/portal/documents
router.get("/staff/portal/documents", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const assignments = await db.select({ caseId: staffAssignmentsTable.caseId })
    .from(staffAssignmentsTable)
    .where(and(eq(staffAssignmentsTable.staffId, staff.id), eq(staffAssignmentsTable.isActive, true)));

  if (assignments.length === 0) { res.json([]); return; }

  const caseIds = assignments.map(a => a.caseId);
  const documents = await db.select().from(documentsTable).where(inArray(documentsTable.caseId, caseIds));
  res.json(documents);
});

// GET /staff/portal/tasks
router.get("/staff/portal/tasks", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const tasks = await db.select().from(staffTasksTable)
    .where(eq(staffTasksTable.assigneeId, staff.id))
    .orderBy(desc(staffTasksTable.createdAt));

  const enriched = await Promise.all(tasks.map(enrichTask));
  res.json(enriched);
});

// PATCH /staff/portal/tasks/:id
router.patch("/staff/portal/tasks/:id", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [task] = await db.select().from(staffTasksTable).where(eq(staffTasksTable.id, id)).limit(1);
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  if (task.assigneeId !== staff.id) { res.status(403).json({ error: "You can only update your own tasks" }); return; }

  const parsed = UpdateStaffPortalTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(staffTasksTable)
    .set({ status: parsed.data.status })
    .where(eq(staffTasksTable.id, id))
    .returning();

  const enriched = await enrichTask(updated);
  res.json(enriched);
});

// GET /staff/portal/profile
router.get("/staff/portal/profile", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, staff.id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [profile] = await db.select().from(staffProfilesTable)
    .where(eq(staffProfilesTable.userId, staff.id)).limit(1);
  if (!profile) { res.status(404).json({ error: "Staff profile not found" }); return; }

  const workload = await getStaffWorkload(staff.id);
  const { passwordHash: _, ...safeUser } = user;

  res.json({ user: safeUser, profile, ...workload });
});

// PATCH /staff/portal/profile
router.patch("/staff/portal/profile", async (req, res): Promise<void> => {
  const staff = await requireStaff(req);
  if (!staff) { res.status(403).json({ error: "Forbidden" }); return; }

  const parsed = UpdateStaffPortalProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mobile, address, profilePhotoUrl, emergencyContactName, emergencyContactMobile } = parsed.data;

  // Update user mobile if provided
  if (mobile !== undefined) {
    await db.update(usersTable).set({ mobile }).where(eq(usersTable.id, staff.id));
  }

  // Update profile fields
  const profileUpdateData: Partial<typeof staffProfilesTable.$inferInsert> = {};
  if (address !== undefined) profileUpdateData.address = address;
  if (profilePhotoUrl !== undefined) profileUpdateData.profilePhotoUrl = profilePhotoUrl;
  if (emergencyContactName !== undefined) profileUpdateData.emergencyContactName = emergencyContactName;
  if (emergencyContactMobile !== undefined) profileUpdateData.emergencyContactMobile = emergencyContactMobile;

  if (Object.keys(profileUpdateData).length > 0) {
    await db.update(staffProfilesTable).set(profileUpdateData).where(eq(staffProfilesTable.userId, staff.id));
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, staff.id)).limit(1);
  const [profile] = await db.select().from(staffProfilesTable).where(eq(staffProfilesTable.userId, staff.id)).limit(1);
  const workload = await getStaffWorkload(staff.id);
  const { passwordHash: _, ...safeUser } = user;

  res.json({ user: safeUser, profile, ...workload });
});

export default router;
