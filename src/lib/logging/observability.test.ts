import { describe, expect, it, vi } from "vitest";

import {
  requestId,
  startOperation,
  withRequestId,
} from "@/lib/logging/observability";

describe("observability", () => {
  it("reuses a safe inbound request ID", () => {
    const request = new Request("https://hiregeneral.test/api/jobs", {
      headers: { "x-request-id": "request-123" },
    });
    expect(requestId(request)).toBe("request-123");
  });

  it("writes structured operation metadata without sensitive values", () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => {});
    const operation = startOperation(
      new Request("https://hiregeneral.test/api/applications"),
      { route: "/api/applications", operation: "submit_application" },
    );

    operation.failure("database", new Error("resume content secret"), {
      email: "candidate@example.com",
    });

    const serialized = JSON.stringify(output.mock.calls);
    expect(serialized).toContain("submit_application");
    expect(serialized).toContain("database");
    expect(serialized).not.toContain("candidate@example.com");
    expect(serialized).not.toContain("resume content secret");
    output.mockRestore();
  });

  it("returns the request ID to the caller", () => {
    const response = withRequestId(Response.json({ ok: true }), "request-123");
    expect(response.headers.get("x-request-id")).toBe("request-123");
  });
});
