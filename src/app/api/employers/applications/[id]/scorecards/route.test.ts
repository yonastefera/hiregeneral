import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({ requireEmployer: vi.fn() }));
vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));
vi.mock("@/lib/rate-limit", () => ({
  employerScorecardRateLimit: { limit: vi.fn() },
}));

import { POST } from "./route";

describe("POST application scorecard", () => {
  it("requires an employer account", async () => {
    mocks.requireEmployer.mockResolvedValue({
      user: null,
      error: "Unauthorized",
      status: 401,
    });
    const request = new NextRequest(
      jsonRequest("/api/employers/applications/x/scorecards", "POST", {}),
    );
    const response = await POST(request, {
      params: Promise.resolve({ id: "22222222-2222-4222-8222-222222222222" }),
    });
    expect(response.status).toBe(401);
  });
});
