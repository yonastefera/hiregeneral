import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  createAdmin: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdmin,
}));
vi.mock("@/lib/rate-limit", () => ({
  adminSeedRateLimit: { limit: mocks.limit },
}));
vi.mock("@/lib/security/audit", () => ({
  recordPrivilegedAction: mocks.audit,
}));

import { POST } from "@/app/api/admin/seed-schools/route";

function request(secret = "test-secret", query = "") {
  return new Request(
    `https://www.hiregeneral.com/api/admin/seed-schools${query}`,
    {
      method: "POST",
      headers: { "x-admin-seed-secret": secret },
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_SEED_SECRET = "test-secret";
  process.env.COLLEGE_SCORECARD_API_KEY = "scorecard-key";
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.audit.mockResolvedValue(undefined);
  mocks.createAdmin.mockReturnValue({ from: vi.fn() });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    }),
  );
});

afterEach(() => {
  delete process.env.ADMIN_SEED_SECRET;
  delete process.env.COLLEGE_SCORECARD_API_KEY;
  vi.unstubAllGlobals();
});

describe("POST /api/admin/seed-schools", () => {
  it("rejects an invalid secret before privileged access", async () => {
    const response = await POST(request("wrong-secret"));
    expect(response.status).toBe(401);
    expect(mocks.createAdmin).not.toHaveBeenCalled();
  });

  it("rate limits authorized import requests", async () => {
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });
    const response = await POST(request());
    expect(response.status).toBe(429);
  });

  it("rejects invalid page parameters", async () => {
    const response = await POST(request("test-secret", "?page=-1"));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("completes an empty import and writes an audit event", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "admin.school_seed_completed" }),
    );
  });

  it("does not expose missing configuration details", async () => {
    delete process.env.COLLEGE_SCORECARD_API_KEY;
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const response = await POST(request());
    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "School import is unavailable." });
    consoleError.mockRestore();
  });
});
