import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  updateUserById: vi.fn(),
  verifyRecoveryAuthorization: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: () => ({ value: "recovery-token" }),
    }),
}));
vi.mock("@/lib/auth/recovery-authorization", () => ({
  RECOVERY_COOKIE: "hg-password-recovery",
  verifyRecoveryAuthorization: mocks.verifyRecoveryAuthorization,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mocks.getUser, signOut: mocks.signOut },
    }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    auth: { admin: { updateUserById: mocks.updateUserById } },
  }),
}));

import { POST } from "@/app/api/auth/password-update/route";

function request() {
  return new NextRequest(
    "https://www.hiregeneral.com/api/auth/password-update",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: "correct-horse-battery-staple",
        passwordConfirmation: "correct-horse-battery-staple",
      }),
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "user-id" } },
    error: null,
  });
  mocks.verifyRecoveryAuthorization.mockReturnValue(true);
  mocks.updateUserById.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
});

describe("POST /api/auth/password-update", () => {
  it("rejects an ordinary login session without recovery authorization", async () => {
    mocks.verifyRecoveryAuthorization.mockReturnValue(false);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it("updates the password and revokes all sessions", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.updateUserById).toHaveBeenCalledWith("user-id", {
      password: "correct-horse-battery-staple",
    });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(response.cookies.get("hg-password-recovery")?.value).toBe("");
  });
});
