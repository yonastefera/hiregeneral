import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  duplicate: vi.fn(),
  limit: vi.fn(),
  rolesEq: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/auth/rate-limit-keys", () => ({
  authRateLimitKeys: () => ({ ip: "ip:test", email: "email:test" }),
}));
vi.mock("@/lib/rate-limit", () => ({
  emailOtpRequestRateLimit: { limit: mocks.limit },
  emailOtpVerifyRateLimit: { limit: mocks.limit },
}));
vi.mock("@/lib/security/abuse", () => ({
  enforceDuplicateCooldown: mocks.duplicate,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({ select: () => ({ eq: mocks.rolesEq }) }),
  }),
}));
vi.mock("@/lib/supabase/public", () => ({
  createSupabasePublicClient: () => ({
    auth: { signInWithOtp: mocks.signInWithOtp },
  }),
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: { setAll: (cookies: unknown[]) => void } },
  ) => ({
    auth: {
      verifyOtp: async (input: unknown) => {
        const result = await mocks.verifyOtp(input);
        if (result.data?.user) {
          options.cookies.setAll([
            {
              name: "sb-test-auth-token",
              value: "session",
              options: { httpOnly: true, path: "/" },
            },
          ]);
        }
        return result;
      },
    },
  }),
}));

import { POST as requestOtp } from "@/app/api/auth/otp/request/route";
import { POST as verifyOtp } from "@/app/api/auth/otp/verify/route";

function request(path: string, body: unknown) {
  return new NextRequest(`https://www.hiregeneral.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  mocks.limit.mockResolvedValue({
    success: true,
    reset: Date.now() + 60_000,
  });
  mocks.duplicate.mockResolvedValue(null);
  mocks.signInWithOtp.mockResolvedValue({ data: {}, error: null });
  mocks.verifyOtp.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mocks.rolesEq.mockResolvedValue({ data: [], error: null });
});

describe("POST /api/auth/otp/request", () => {
  it("normalizes email and requests a six-digit email OTP", async () => {
    const response = await requestOtp(
      request("/api/auth/otp/request", { email: " Person@Example.COM " }),
    );

    expect(response.status).toBe(200);
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "person@example.com",
      options: { shouldCreateUser: true },
    });
  });

  it("rejects invalid or unexpected fields", async () => {
    const response = await requestOtp(
      request("/api/auth/otp/request", {
        email: "not-an-email",
        isAdmin: true,
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it("does not expose identity-provider errors", async () => {
    mocks.signInWithOtp.mockResolvedValue({
      data: {},
      error: { code: "over_email_send_rate_limit", status: 429 },
    });

    const response = await requestOtp(
      request("/api/auth/otp/request", { email: "person@example.com" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      message: "If the address is eligible, a code will arrive shortly.",
    });
  });

  it("rate limits repeated requests", async () => {
    mocks.limit.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 30_000,
    });

    const response = await requestOtp(
      request("/api/auth/otp/request", { email: "person@example.com" }),
    );

    expect(response.status).toBe(429);
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/otp/verify", () => {
  it("rejects malformed codes before verification", async () => {
    const response = await verifyOtp(
      request("/api/auth/otp/verify", {
        email: "person@example.com",
        token: "12345x",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("returns a generic error for an invalid or expired code", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: null },
      error: { code: "otp_expired", status: 403 },
    });

    const response = await verifyOtp(
      request("/api/auth/otp/verify", {
        email: "person@example.com",
        token: "123456",
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "That code is invalid or expired. Request a new code.",
    });
  });

  it("creates the session and routes a new user to role selection", async () => {
    const response = await verifyOtp(
      request("/api/auth/otp/verify", {
        email: "person@example.com",
        token: "123456",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      role: null,
      redirectTo: "/auth/choose-role",
    });
    expect(response.headers.get("set-cookie")).toContain("sb-test-auth-token");
  });

  it("routes an existing seeker directly to jobs", async () => {
    mocks.rolesEq.mockResolvedValue({
      data: [{ role: "job_seeker" }],
      error: null,
    });

    const response = await verifyOtp(
      request("/api/auth/otp/verify", {
        email: "person@example.com",
        token: "123456",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      role: "job_seeker",
      redirectTo: "/jobs",
    });
  });

  it("rate limits repeated verification attempts", async () => {
    mocks.limit.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 30_000,
    });

    const response = await verifyOtp(
      request("/api/auth/otp/verify", {
        email: "person@example.com",
        token: "123456",
      }),
    );

    expect(response.status).toBe(429);
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });
});
