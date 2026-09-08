import express from "express";
import { PassThrough } from "node:stream";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const state = vi.hoisted(() => ({
  selects: [] as Row[][],
  inserted: [] as Row[][],
  updated: [] as Row[][],
  whereArgs: [] as unknown[],
  logs: [] as unknown[][],
  storage: {
    create: vi.fn(),
    validate: vi.fn(),
    download: vi.fn(),
    read: vi.fn(),
  },
  analyze: vi.fn(),
}));

vi.mock("@workspace/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/db")>();
  const chain = (rows: Row[]) => {
    const value: Record<string, unknown> = {};
    for (const method of ["from", "orderBy", "innerJoin", "leftJoin"]) value[method] = vi.fn(() => value);
    value.where = vi.fn((condition: unknown) => {
      state.whereArgs.push(condition);
      return value;
    });
    value.limit = vi.fn(async () => rows);
    value.returning = vi.fn(async () => rows);
    value.then = (resolve: (rows: Row[]) => unknown) => Promise.resolve(rows).then(resolve);
    return value;
  };
  const db = {
    select: vi.fn(() => chain(state.selects.shift() ?? [])),
    update: vi.fn(() => {
      const value = chain(state.updated.shift() ?? []);
      value.set = vi.fn(() => value);
      return value;
    }),
    insert: vi.fn(() => {
      const value = chain(state.inserted.shift() ?? []);
      value.values = vi.fn(() => value);
      return value;
    }),
    delete: vi.fn(() => chain([])),
  };
  return { ...actual, db };
});

vi.mock("../lib/private-storage", () => ({
  createReportUpload: state.storage.create,
  validateReportObject: state.storage.validate,
  downloadReport: state.storage.download,
  readReport: state.storage.read,
}));
vi.mock("../lib/report-analysis", () => ({ analyzeReportText: state.analyze }));

import router from "./credit-reports";
import { creditReportsTable } from "@workspace/db";

const customerA = { id: 10, role: "CUSTOMER" };
const customerB = { id: 20, role: "CUSTOMER" };
const admin = { id: 1, role: "OWNER" };
const reportA = {
  id: 101, customerId: 10, uploaderId: 10,
  objectPath: "/objects/reports/10/11111111-1111-4111-8111-111111111111",
  originalFilename: "private.pdf", contentType: "application/pdf",
  processingStatus: "UPLOADED", isCurrent: true, score: null,
  accounts: null, factors: null, flags: null, reviewedById: null,
};
const reportB = { ...reportA, id: 202, customerId: 20, uploaderId: 20, objectPath: "/objects/reports/20/22222222-2222-4222-8222-222222222222" };

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use((req, _res, next) => {
    (req as unknown as { session: Row }).session = { userId: Number(req.header("x-user-id")) };
    (req as unknown as { log: Row }).log = {
      warn: vi.fn((...args: unknown[]) => state.logs.push(args)),
      error: vi.fn((...args: unknown[]) => state.logs.push(args)),
    };
    next();
  });
  instance.use("/api", router);
  return instance;
}

beforeEach(() => {
  state.selects.length = 0;
  state.inserted.length = 0;
  state.updated.length = 0;
  state.whereArgs.length = 0;
  state.logs.length = 0;
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllGlobals());

describe("private credit report lifecycle", () => {
  it("creates a customer-scoped signed upload contract without leaking its object path in logs", async () => {
    state.selects.push([customerA], [customerA]);
    state.storage.create.mockResolvedValue({
      uploadURL: "https://signed.invalid/put",
      objectPath: reportA.objectPath,
      headers: { "Content-Type": "application/pdf" },
    });
    const response = await request(app()).post("/api/credit-reports/upload-url").set("x-user-id", "10").send({ contentType: "application/pdf", size: 42 });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ uploadURL: expect.any(String), headers: { "Content-Type": "application/pdf" } }));
    expect(state.storage.create).toHaveBeenCalledWith(10, "application/pdf");
    expect(JSON.stringify(state.logs)).not.toContain(reportA.objectPath);
  });

  it("finalizes a validated upload and strips the private object path from the response", async () => {
    state.selects.push([customerA]);
    state.updated.push([]);
    state.inserted.push([reportA]);
    const response = await request(app()).post("/api/credit-reports/finalize").set("x-user-id", "10").send({
      objectPath: reportA.objectPath, originalFilename: "private.pdf", contentType: "application/pdf", size: 42,
    });
    expect(response.status).toBe(201);
    expect(state.storage.validate).toHaveBeenCalledWith(reportA.objectPath, 10, "application/pdf", 42);
    expect(response.body.objectPath).toBeUndefined();
  });

  it("lets an admin upload on behalf of a customer while preserving the admin as uploader", async () => {
    const delegated = { ...reportB, uploaderId: admin.id };
    state.selects.push([admin], [customerB]);
    state.storage.create.mockResolvedValue({ uploadURL: "https://signed.invalid/put", objectPath: reportB.objectPath, headers: { "Content-Type": "application/pdf" } });
    const upload = await request(app()).post("/api/credit-reports/upload-url").set("x-user-id", "1").send({ customerId: 20, contentType: "application/pdf", size: 42 });
    expect(upload.status).toBe(200);
    expect(state.storage.create).toHaveBeenCalledWith(20, "application/pdf");

    state.selects.push([admin]);
    state.updated.push([]);
    state.inserted.push([delegated]);
    const finalized = await request(app()).post("/api/credit-reports/finalize").set("x-user-id", "1").send({
      customerId: 20, objectPath: reportB.objectPath, originalFilename: "customer-b.pdf", contentType: "application/pdf", size: 42,
    });
    expect(finalized.status).toBe(201);
    expect(finalized.body).toEqual(expect.objectContaining({ customerId: 20, uploaderId: 1 }));
    expect(finalized.body.objectPath).toBeUndefined();
  });

  it("processes a passworded PDF, reloads the safe record, and never returns the password or object path", async () => {
    state.selects.push([customerA], [reportA]);
    state.storage.read.mockResolvedValue(Buffer.from("%PDF-private"));
    state.analyze.mockRejectedValue(new Error("offline"));
    state.updated.push([{ ...reportA, processingStatus: "NEEDS_MANUAL_REVIEW", accounts: [], factors: [], flags: [] }]);
    const processed = await request(app()).post("/api/credit-reports/101/process").set("x-user-id", "10").send({ password: "top-secret-pdf-password" });
    expect(processed.status).toBe(200);
    expect(JSON.stringify(processed.body)).not.toContain("top-secret-pdf-password");
    expect(processed.body.objectPath).toBeUndefined();
    expect(JSON.stringify(state.logs)).not.toContain("top-secret-pdf-password");
    expect(JSON.stringify(state.logs)).not.toContain(reportA.objectPath);

    state.selects.push([customerA], [{ ...reportA, processingStatus: "NEEDS_MANUAL_REVIEW" }]);
    const reloaded = await request(app()).get("/api/credit-reports/101").set("x-user-id", "10");
    expect(reloaded.status).toBe(200);
    expect(reloaded.body.objectPath).toBeUndefined();
  });

  it("streams a private download only to the owning customer", async () => {
    state.selects.push([customerA], [reportA]);
    state.storage.download.mockImplementation(async () => {
      const stream = new PassThrough();
      queueMicrotask(() => stream.end(Buffer.from("private-report-bytes")));
      return stream;
    });
    const response = await request(app()).get("/api/credit-reports/101/download").set("x-user-id", "10");
    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.body.toString()).toBe("private-report-bytes");
  });
});

describe("customer isolation", () => {
  it.each([
    ["list", "get", "/api/credit-reports"],
    ["read", "get", "/api/credit-reports/202"],
    ["download", "get", "/api/credit-reports/202/download"],
    ["process", "post", "/api/credit-reports/202/process"],
    ["compare", "get", "/api/credit-reports/101/comparison/202"],
  ] as const)("prevents Customer A from %s access to Customer B reports", async (_label, method, path) => {
    if (path === "/api/credit-reports") {
      state.selects.push([customerA], [reportA]);
      const response = await request(app())[method](path).set("x-user-id", "10");
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].customerId).toBe(10);
      expect(state.whereArgs.at(-1)).toEqual(eq(creditReportsTable.customerId, customerA.id));
      return;
    }
    state.selects.push([customerA], [reportB]);
    if (path.includes("comparison")) state.selects.push([customerA], [reportB]);
    const response = await request(app())[method](path).set("x-user-id", "10");
    expect(response.status).toBe(404);
    expect(JSON.stringify(response.body)).not.toContain(reportB.objectPath);
  });

  it("rejects Customer A finalizing an object path scoped to Customer B", async () => {
    state.selects.push([customerA]);
    state.storage.validate.mockRejectedValue(new Error(`Upload path does not belong to customer: ${reportB.objectPath}`));
    const response = await request(app()).post("/api/credit-reports/finalize").set("x-user-id", "10").send({
      objectPath: reportB.objectPath, originalFilename: "stolen.pdf", contentType: "application/pdf", size: 42,
    });
    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body)).not.toContain(reportB.objectPath);
    expect(JSON.stringify(state.logs)).not.toContain(reportB.objectPath);
  });
});

describe("quote approval gate", () => {
  it.each([
    { label: "unapproved", report: { ...reportA, processingStatus: "NEEDS_MANUAL_REVIEW", accounts: [], factors: [], flags: [] } },
    { label: "unvalidated", report: { ...reportA, processingStatus: "PROCESSED", reviewedById: admin.id, accounts: null, factors: [], flags: [] } },
  ])("rejects an $label report", async ({ report }) => {
    state.selects.push([customerA], [{ id: 9, isActive: true, baseFee: "1000.00" }], [report]);
    const response = await request(app()).get("/api/quotes/current").set("x-user-id", "10");
    expect(response.status).toBe(409);
    expect(response.body.error).toContain("administrator-approved");
  });

  it("returns a quote only for an approved report with validated findings", async () => {
    const approved = { ...reportA, processingStatus: "PROCESSED", reviewedById: admin.id, accounts: [], factors: [], flags: [{ type: "LATE_PAYMENT" }] };
    state.selects.push([customerA], [{ id: 9, version: 3, isActive: true, baseFee: "1000.00", issueFees: { LATE_PAYMENT: 250 }, capFee: null }], [approved]);
    state.inserted.push([{ id: 77, customerId: 10, reportId: 101, total: "1250.00" }]);
    const response = await request(app()).get("/api/quotes/current").set("x-user-id", "10");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ reportId: 101, total: 1250, ruleVersion: 3 }));
  });
});