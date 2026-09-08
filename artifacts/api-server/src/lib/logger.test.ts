import pino from "pino";
import { describe, expect, it } from "vitest";
import { sensitiveLogPaths } from "./logger";

describe("sensitive logging", () => {
  it("redacts password, PAN, and private object paths with the production logger policy", () => {
    let output = "";
    const destination = { write(chunk: string) { output += chunk; } };
    const testLogger = pino({ redact: sensitiveLogPaths }, destination);
    testLogger.warn({
      req: {
        headers: { authorization: "Bearer secret", cookie: "session=secret" },
        body: {
          password: "top-secret-pdf-password",
          pan: "ABCDE1234F",
          objectPath: "/objects/reports/10/private-object",
        },
      },
    }, "sensitive request rejected");

    expect(output).toContain("[Redacted]");
    expect(output).not.toContain("top-secret-pdf-password");
    expect(output).not.toContain("ABCDE1234F");
    expect(output).not.toContain("/objects/reports/10/private-object");
    expect(output).not.toContain("Bearer secret");
    expect(output).not.toContain("session=secret");
  });
});