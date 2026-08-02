import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assignInitialRole: vi.fn(),
  createClient: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/auth/role-assignment", () => ({
  assignInitialRole: mocks.assignInitialRole,
  primaryRole: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  roleSelectionRateLimit: { limit: mocks.limit },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({}),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { POST } from "@/app/api/auth/role/route";

function request(body: unknown) {
  return new NextRequest("https://www.hiregeneral.com/api/auth/role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.assignInitialRole.mockResolvedValue("recruiter");
  mocks.createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-id", email: "person@example.com" } },
        error: null,
      }),
    },
  });
});

describe("POST /api/auth/role", () => {
  it("requires authentication", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: null }, error: null }),
      },
    });
    expect((await POST(request({ role: "recruiter" }))).status).toBe(401);
  });

  it.each(["admin", "unknown"])("rejects the %s role", async (role) => {
    expect((await POST(request({ role }))).status).toBe(400);
    expect(mocks.assignInitialRole).not.toHaveBeenCalled();
  });

  it("rejects unknown fields", async () => {
    expect(
      (await POST(request({ role: "recruiter", admin: true }))).status,
    ).toBe(400);
  });

  it("rate limits repeated role selection", async () => {
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });
    const response = await POST(request({ role: "recruiter" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it("preserves the role returned by the atomic assignment", async () => {
    mocks.assignInitialRole.mockResolvedValue("admin");
    const response = await POST(request({ role: "job_seeker" }));
    expect(await response.json()).toEqual({
      role: "admin",
      redirectTo: "/admin/dashboard",
    });
  });
});
