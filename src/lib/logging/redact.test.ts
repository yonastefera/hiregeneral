import { describe, expect, it, vi } from "vitest";

import { redactLogValue, writeRedactedLog } from "@/lib/logging/redact";

describe("log redaction", () => {
  it("redacts personal data, secrets, tokens, and storage paths", () => {
    const redacted = redactLogValue({
      email: "person@example.com",
      note: "Call 212-555-0100 or email person@example.com",
      authorization: "Bearer secret-value",
      path: "22222222-2222-4222-8222-222222222222/private-resume.pdf",
      nested: { password: "do-not-log" },
    });
    const serialized = JSON.stringify(redacted);

    expect(serialized).not.toContain("person@example.com");
    expect(serialized).not.toContain("212-555-0100");
    expect(serialized).not.toContain("secret-value");
    expect(serialized).not.toContain("private-resume.pdf");
    expect(serialized).not.toContain("do-not-log");
  });

  it("writes structured redacted log entries", () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => {});

    writeRedactedLog("error", "provider_failed", {
      email: "person@example.com",
      error: new Error("private provider details"),
    });

    const serialized = JSON.stringify(output.mock.calls);
    expect(serialized).toContain("provider_failed");
    expect(serialized).not.toContain("person@example.com");
    expect(serialized).not.toContain("private provider details");
    output.mockRestore();
  });
});
