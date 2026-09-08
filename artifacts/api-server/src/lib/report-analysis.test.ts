import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeReportText } from "./report-analysis";

afterEach(() => vi.unstubAllGlobals());

describe("report analysis privacy", () => {
  it("redacts PAN before sending report text to the AI provider", async () => {
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "https://ai.invalid";
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const requestBody = JSON.parse(String(init?.body));
      expect(requestBody.messages[1].content).not.toContain("ABCDE1234F");
      expect(requestBody.messages[1].content).toContain("[REDACTED_PAN]");
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        analysis: {}, accounts: [], factors: [], flags: [],
        summaries: { ENGLISH: "Safe", HINDI: "Safe", ASSAMESE: "Safe" }, confidence: 50,
      }) } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await analyzeReportText("PAN ABCDE1234F has no late accounts");
    expect(result.confidence).toBe("50.00");
  });
});