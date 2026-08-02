import type { Ratelimit } from "@upstash/ratelimit";
import { describe, expect, it, vi } from "vitest";

import {
  boundedJsonBody,
  boundedTextBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";

describe("API security helpers", () => {
  it("rejects declared and actual oversized JSON bodies", async () => {
    const declared = new Request("https://hiregeneral.test/api", {
      method: "POST",
      headers: { "content-length": "100" },
      body: "{}",
    });
    const actual = new Request("https://hiregeneral.test/api", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(100) }),
    });

    const declaredResult = await boundedJsonBody(declared, 32);
    const actualResult = await boundedJsonBody(actual, 32);

    expect(declaredResult.ok).toBe(false);
    expect(declaredResult.ok || declaredResult.response.status).toBe(413);
    expect(actualResult.ok).toBe(false);
    expect(actualResult.ok || actualResult.response.status).toBe(413);
  });

  it("rejects malformed JSON without invoking route validation", async () => {
    const request = new Request("https://hiregeneral.test/api", {
      method: "POST",
      body: "{invalid",
    });

    const result = await boundedJsonBody(request);

    expect(result.ok).toBe(false);
    expect(result.ok || result.response.status).toBe(400);
  });

  it("caps raw webhook payloads", async () => {
    const request = new Request("https://hiregeneral.test/webhook", {
      method: "POST",
      body: "x".repeat(20),
    });

    const result = await boundedTextBody(request, 10);

    expect(result.ok).toBe(false);
    expect(result.ok || result.response.status).toBe(413);
  });

  it("returns 429 with Retry-After when a mutation exceeds its limit", async () => {
    const limiter = {
      limit: vi.fn().mockResolvedValue({
        success: false,
        reset: Date.now() + 30_000,
      }),
    } as unknown as Ratelimit;

    const response = await enforceRateLimit({
      limiter,
      key: "user-id",
      context: "test_mutation",
    });

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBeTruthy();
  });

  it("never returns provider details and logs only safe metadata", async () => {
    const error = Object.assign(new Error("private database table detail"), {
      code: "DB100",
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    logServerError("test_failure", error);
    const response = safeServerError("Could not complete the request.");
    const payload = await response.json();

    expect(payload).toEqual({ error: "Could not complete the request." });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private database table detail",
    );
    expect(JSON.stringify(consoleError.mock.calls)).toContain("DB100");
    consoleError.mockRestore();
  });
});
