import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({ requireEmployer: vi.fn() }));
vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));
vi.mock("@/lib/rate-limit", () => ({
  employerTeamRateLimit: { limit: vi.fn() },
}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));

import { POST } from "./route";

describe("POST employer team", () => {
  it("requires an employer account", async () => {
    mocks.requireEmployer.mockResolvedValue({
      user: null,
      error: "Unauthorized",
      status: 401,
    });
    const response = await POST(
      new NextRequest(jsonRequest("/api/employers/team", "POST", {})),
    );
    expect(response.status).toBe(401);
  });
});
