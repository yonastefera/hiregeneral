import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({
  createAdmin: vi.fn(),
  duplicate: vi.fn(),
  limit: vi.fn(),
  loadEntitlements: vi.fn(),
  requireEmployer: vi.fn(),
}));

vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdmin,
}));
vi.mock("@/lib/rate-limit", () => ({
  employerInviteRateLimit: { limit: mocks.limit },
}));
vi.mock("@/lib/security/abuse", () => ({
  enforceDuplicateCooldown: mocks.duplicate,
}));
vi.mock("@/lib/billing/entitlements", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/billing/entitlements")>();
  return { ...original, loadEmployerEntitlements: mocks.loadEntitlements };
});

import { POST } from "@/app/api/employers/invite/route";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "r@test" };
const candidateId = "22222222-2222-4222-8222-222222222222";
const jobId = "33333333-3333-4333-8333-333333333333";

function request(body: unknown) {
  return new NextRequest(jsonRequest("/api/employers/invite", "POST", body));
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    candidateId,
    jobId,
    message: "We would like to discuss this role with you.",
    ...overrides,
  };
}

function query(result: { data: unknown; error: unknown }) {
  const value = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    upsert: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
  };
  value.select.mockReturnValue(value);
  value.eq.mockReturnValue(value);
  value.upsert.mockReturnValue(value);
  return value;
}

function createSupabase(options?: {
  job?: object | null;
  profile?: object | null;
  jobError?: object | null;
  inviteError?: object | null;
}) {
  const job = query({
    data: options?.job === undefined ? { id: jobId } : options.job,
    error: options?.jobError ?? null,
  });
  const profile = query({
    data:
      options?.profile === undefined ? { id: candidateId } : options.profile,
    error: null,
  });
  const invite = query({
    data: options?.inviteError
      ? null
      : { id: "invite-id", status: "sent", created_at: "2026-08-14" },
    error: options?.inviteError ?? null,
  });
  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "jobs") return job;
      if (table === "profiles") return profile;
      return invite;
    }),
    job,
    profile,
    invite,
  };
  mocks.createAdmin.mockReturnValue(supabase);
  return supabase;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.duplicate.mockResolvedValue(null);
  mocks.loadEntitlements.mockResolvedValue({
    candidateDatabase: true,
    invitationsUsed: 0,
    invitationLimit: 10,
  });
  mocks.requireEmployer.mockResolvedValue({
    user,
    supabase: createSupabase(),
    status: 200,
  });
});

describe("POST /api/employers/invite", () => {
  it.each([401, 403])(
    "enforces employer authorization (%i)",
    async (status) => {
      mocks.requireEmployer.mockResolvedValue({
        user: null,
        error: status === 401 ? "Unauthorized" : "Employer role required",
        status,
      });
      const response = await POST(request(validBody()));
      expect(response.status).toBe(status);
      expect(mocks.limit).not.toHaveBeenCalled();
    },
  );

  it.each([
    validBody({ candidateId: "invalid" }),
    validBody({ recruiter_id: "attacker-controlled" }),
  ])("rejects invalid and unknown fields", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
  });

  it("enforces rate and duplicate limits", async () => {
    mocks.duplicate.mockResolvedValue(
      NextResponse.json({ error: "Duplicate request." }, { status: 429 }),
    );
    const response = await POST(request(validBody()));
    expect(response.status).toBe(429);
  });

  it("enforces invitation entitlements", async () => {
    mocks.loadEntitlements.mockResolvedValue({
      candidateDatabase: true,
      invitationsUsed: 10,
      invitationLimit: 10,
    });
    const response = await POST(request(validBody()));
    expect(response.status).toBe(403);
  });

  it("rejects jobs not owned by the recruiter", async () => {
    const supabase = createSupabase({ job: null });
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });
    const response = await POST(request(validBody()));
    expect(response.status).toBe(404);
    expect(supabase.job.eq).toHaveBeenCalledWith("recruiter_id", user.id);
  });

  it("rejects non-public candidate profiles", async () => {
    const supabase = createSupabase({ profile: null });
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });
    const response = await POST(request(validBody()));
    expect(response.status).toBe(404);
    expect(supabase.profile.eq).toHaveBeenCalledWith("visibility", "public");
  });

  it("creates an invitation with server-controlled ownership", async () => {
    const supabase = createSupabase();
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });
    const response = await POST(request(validBody()));
    expect(response.status).toBe(201);
    expect(supabase.invite.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        recruiter_id: user.id,
        candidate_id: candidateId,
        job_id: jobId,
        status: "sent",
      }),
      { onConflict: "recruiter_id,candidate_id,job_id" },
    );
  });

  it("does not expose database errors", async () => {
    const supabase = createSupabase({
      jobError: { code: "DB100", message: "private detail" },
    });
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const response = await POST(request(validBody()));
    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(payload)).not.toContain("private detail");
    consoleError.mockRestore();
  });
});
