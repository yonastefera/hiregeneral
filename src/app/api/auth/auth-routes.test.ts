import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateLink: vi.fn(),
  limit: vi.fn(),
  sendConfirmationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("@/lib/auth/rate-limit-keys", () => ({
  authRateLimitKeys: () => ({ ip: "ip:test", email: "email:test" }),
}));
vi.mock("@/lib/rate-limit", () => ({
  signupRateLimit: { limit: mocks.limit },
  passwordResetRateLimit: { limit: mocks.limit },
}));

vi.mock("@/lib/security/abuse", () => ({
  enforceDuplicateCooldown: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    auth: { admin: { generateLink: mocks.generateLink } },
  }),
}));
vi.mock("@/lib/email/send", () => ({
  sendConfirmationEmail: mocks.sendConfirmationEmail,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}));

import { POST as resetPassword } from "@/app/api/auth/password-reset/route";
import { POST as signup } from "@/app/api/auth/signup/route";

function request(path: string, body: unknown) {
  return new NextRequest(`https://www.hiregeneral.com${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.sendConfirmationEmail.mockResolvedValue({});
  mocks.sendPasswordResetEmail.mockResolvedValue({});
});

describe("POST /api/auth/signup", () => {
  it("rejects public admin-role assignment", async () => {
    const response = await signup(
      request("/api/auth/signup", {
        email: "admin@example.com",
        password: "correct-horse-battery-staple",
        role: "admin",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.generateLink).not.toHaveBeenCalled();
  });

  it("returns the generic eligibility response for duplicate signup", async () => {
    mocks.generateLink.mockResolvedValue({
      data: {},
      error: { message: "User already registered" },
    });
    const response = await signup(
      request("/api/auth/signup", {
        email: "person@example.com",
        password: "correct-horse-battery-staple",
        role: "job_seeker",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      message: "If the address is eligible, an email will arrive shortly.",
    });
  });

  it.each(["admin", "owner", "unknown"])(
    "rejects the %s role",
    async (role) => {
      const response = await signup(
        request("/api/auth/signup", {
          email: "person@example.com",
          password: "correct-horse-battery-staple",
          role,
        }),
      );
      expect(response.status).toBe(400);
    },
  );

  it.each(["job_seeker", "recruiter"])(
    "accepts a valid %s signup",
    async (role) => {
      mocks.generateLink.mockResolvedValue({
        data: { properties: { action_link: "https://example.test/confirm" } },
        error: null,
      });
      const response = await signup(
        request("/api/auth/signup", {
          email: " Person@Example.COM ",
          password: "correct-horse-battery-staple",
          role,
        }),
      );
      expect(response.status).toBe(200);
      expect(mocks.generateLink).toHaveBeenCalledWith(
        expect.objectContaining({ email: "person@example.com" }),
      );
    },
  );

  it("rejects unknown signup fields", async () => {
    const response = await signup(
      request("/api/auth/signup", {
        email: "person@example.com",
        password: "correct-horse-battery-staple",
        role: "job_seeker",
        isAdmin: true,
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rate limits by both request and email identity", async () => {
    mocks.limit.mockResolvedValueOnce({
      success: false,
      reset: Date.now() + 30_000,
    });
    const response = await signup(
      request("/api/auth/signup", {
        email: "person@example.com",
        password: "correct-horse-battery-staple",
        role: "job_seeker",
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });
});

describe("POST /api/auth/password-reset", () => {
  it("returns the same success for a missing account", async () => {
    mocks.generateLink.mockResolvedValue({
      data: {},
      error: { message: "User not found" },
    });
    const response = await resetPassword(
      request("/api/auth/password-reset", { email: "missing@example.com" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      message: "If the address is eligible, an email will arrive shortly.",
    });
  });

  it("does not reveal reset email delivery failures", async () => {
    mocks.generateLink.mockResolvedValue({
      data: {
        properties: { action_link: "https://example.test/reset" },
        user: {},
      },
      error: null,
    });
    mocks.sendPasswordResetEmail.mockRejectedValue(
      new Error("delivery failed"),
    );
    const response = await resetPassword(
      request("/api/auth/password-reset", { email: "person@example.com" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      message: "If the address is eligible, an email will arrive shortly.",
    });
  });
});
