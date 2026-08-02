import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assignInitialRole: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  rolesResult: { data: [] as Array<{ role: string }>, error: null as unknown },
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ getAll: () => [], set: vi.fn() }),
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getUser: mocks.getUser,
    },
  }),
}));
vi.mock("@/lib/auth/recovery-authorization", () => ({
  RECOVERY_COOKIE: "hg-password-recovery",
  createRecoveryAuthorization: () => "recovery-token",
}));
vi.mock("@/lib/auth/log", () => ({ logAuthEvent: vi.fn() }));
vi.mock("@/lib/auth/role-assignment", () => ({
  assignInitialRole: mocks.assignInitialRole,
  primaryRole: (rows: Array<{ role: string }> | null) =>
    rows?.find((row) => row.role === "admin")?.role ??
    rows?.find((row) => row.role === "recruiter")?.role ??
    rows?.find((row) => row.role === "job_seeker")?.role ??
    null,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => Promise.resolve(mocks.rolesResult) }),
    }),
  }),
}));

import { GET } from "@/app/auth/callback/route";

function request(next?: string) {
  const url = new URL("https://untrusted.test/auth/callback");
  url.searchParams.set("code", "oauth-code");
  if (next) url.searchParams.set("next", next);
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "https://www.hiregeneral.com";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  mocks.rolesResult = { data: [], error: null };
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: "user-id",
        email: "person@example.com",
        user_metadata: {},
      },
    },
  });
});

describe("GET /auth/callback", () => {
  it("assigns a valid recruiter role and uses the correct route", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          email: "person@example.com",
          user_metadata: { role: "recruiter" },
        },
      },
    });
    mocks.assignInitialRole.mockResolvedValue("recruiter");

    const response = await GET(request());
    expect(mocks.assignInitialRole).toHaveBeenCalledWith(
      expect.objectContaining({ role: "recruiter", source: "oauth_callback" }),
    );
    expect(response.headers.get("location")).toBe(
      "https://www.hiregeneral.com/employers/dashboard",
    );
  });

  it("ignores forged admin metadata", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-id",
          email: "person@example.com",
          user_metadata: { role: "admin" },
        },
      },
    });

    const response = await GET(request());
    expect(mocks.assignInitialRole).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://www.hiregeneral.com/auth/choose-role",
    );
  });

  it("preserves an existing admin role", async () => {
    mocks.rolesResult = { data: [{ role: "admin" }], error: null };
    const response = await GET(request());
    expect(mocks.assignInitialRole).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://www.hiregeneral.com/admin/dashboard",
    );
  });

  it("fails safely when a callback code is invalid or already used", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid code" },
    });
    const response = await GET(request("//evil.test"));
    expect(response.headers.get("location")).toBe(
      "https://www.hiregeneral.com/signin?error=oauth",
    );
  });
});
