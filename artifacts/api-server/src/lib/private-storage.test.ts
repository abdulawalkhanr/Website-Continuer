import { beforeEach, describe, expect, it, vi } from "vitest";

const storageState = vi.hoisted(() => ({
  file: {
    name: "private/reports/10/test",
    getMetadata: vi.fn(),
    download: vi.fn(),
    createReadStream: vi.fn(),
  },
}));
vi.mock("@google-cloud/storage", () => ({
  Storage: class {
    bucket() { return { file: () => storageState.file }; }
  },
}));

import { createReportUpload, isReportObjectPath, validateReportObject } from "./private-storage";

beforeEach(() => {
  process.env.PRIVATE_OBJECT_DIR = "bucket/private";
  vi.clearAllMocks();
});

describe("private report storage", () => {
  it("accepts only UUID-like paths scoped to the customer", () => {
    expect(isReportObjectPath("/objects/reports/10/11111111-1111-4111-8111-111111111111", 10)).toBe(true);
    expect(isReportObjectPath("/objects/reports/20/11111111-1111-4111-8111-111111111111", 10)).toBe(false);
    expect(isReportObjectPath("/objects/reports/10/../../secret", 10)).toBe(false);
  });

  it("creates a signed PUT contract and successfully sends bytes with its required content type", async () => {
    const signedPut = vi.fn(async (_url: string, init?: RequestInit) => new Response(null, { status: init?.method === "PUT" ? 200 : 405 }));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ signed_url: "https://signed.invalid/upload" }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockImplementationOnce(signedPut);
    vi.stubGlobal("fetch", fetchMock);
    const contract = await createReportUpload(10, "application/pdf");
    const signingRequest = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(signingRequest).toEqual(expect.objectContaining({
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
    }));
    const put = await fetch(contract.uploadURL, { method: "PUT", headers: contract.headers, body: Buffer.from("%PDF-test") });
    expect(put.ok).toBe(true);
    expect(contract.objectPath).toMatch(/^\/objects\/reports\/10\//);
    expect(signedPut).toHaveBeenCalledWith(contract.uploadURL, expect.objectContaining({ method: "PUT", headers: { "Content-Type": "application/pdf" } }));
  });

  it("validates size, type, and file signature before finalize", async () => {
    storageState.file.getMetadata.mockResolvedValue([{ size: "9", contentType: "application/pdf" }]);
    storageState.file.download.mockResolvedValue([Buffer.from("%PDF-test")]);
    await expect(validateReportObject("/objects/reports/10/11111111-1111-4111-8111-111111111111", 10, "application/pdf", 9)).resolves.toBeUndefined();
    storageState.file.download.mockResolvedValue([Buffer.from("not-a-pdf")]);
    await expect(validateReportObject("/objects/reports/10/11111111-1111-4111-8111-111111111111", 10, "application/pdf", 9)).rejects.toThrow("signature");
  });
});