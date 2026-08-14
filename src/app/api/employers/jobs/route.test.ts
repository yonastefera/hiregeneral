import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonRequest } from "@/test/api-request";

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  loadEntitlements: vi.fn(),
  requireEmployer: vi.fn(),
}));

vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));
vi.mock("@/lib/rate-limit", () => ({
  employerJobRateLimit: { limit: mocks.limit },
}));
vi.mock("@/lib/billing/entitlements", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/billing/entitlements")>();
  return { ...original, loadEmployerEntitlements: mocks.loadEntitlements };
});

import { POST, PUT } from "@/app/api/employers/jobs/route";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "r@test" };
const companyId = "22222222-2222-4222-8222-222222222222";
const jobId = "33333333-3333-4333-8333-333333333333";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    title: "Platform Engineer",
    companyName: "Acme",
    location: "New York, NY",
    remote: "no",
    description: "Build and operate reliable distributed systems.",
    skills: "TypeScript, PostgreSQL",
    benefits: ["Health insurance"],
    salaryMin: 120000,
    salaryMax: 160000,
    status: "published",
    ...overrides,
  };
}

function request(method: "POST" | "PUT", body: unknown) {
  return new NextRequest(jsonRequest("/api/employers/jobs", method, body));
}

function queryResult(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
  };
  query.select.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

function createPostSupabase(options?: {
  companyError?: object | null;
  jobError?: object | null;
}) {
  const company = queryResult({
    data: { id: companyId, logo_url: null, website: null },
    error: options?.companyError ?? null,
  });
  const job = queryResult({
    data: options?.jobError
      ? null
      : {
          id: jobId,
          slug: "acme-platform-engineer-test",
          status: "published",
          title: "Platform Engineer",
          company_name: "Acme",
          created_at: "2026-08-14T00:00:00Z",
        },
    error: options?.jobError ?? null,
  });

  return {
    from: vi.fn((table: string) => (table === "companies" ? company : job)),
    company,
    job,
  };
}

function createPutSupabase(options?: {
  existingJob?: { id: string; status: string; boost_id: string } | null;
  lookupError?: object | null;
  updateError?: object | null;
}) {
  const lookup = queryResult({
    data:
      options?.existingJob === undefined
        ? { id: jobId, status: "draft", boost_id: "none" }
        : options.existingJob,
    error: options?.lookupError ?? null,
  });
  const update = queryResult({
    data: options?.updateError
      ? null
      : {
          id: jobId,
          slug: "acme-platform-engineer-test",
          status: "published",
          title: "Platform Engineer",
          company_name: "Acme",
          created_at: "2026-08-14T00:00:00Z",
        },
    error: options?.updateError ?? null,
  });
  let jobCalls = 0;
  return {
    from: vi.fn(() => {
      jobCalls += 1;
      return jobCalls === 1 ? lookup : update;
    }),
    lookup,
    update,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.loadEntitlements.mockResolvedValue({
    activeJobs: 0,
    activeJobLimit: 5,
    boostCredits: 1,
  });
  mocks.requireEmployer.mockResolvedValue({
    user,
    supabase: createPostSupabase(),
    error: null,
    status: 200,
  });
});

describe("employer job mutations", () => {
  it.each([
    [POST, 401, "Unauthorized"],
    [PUT, 403, "Only employer accounts can manage employer tools."],
  ] as const)(
    "enforces authentication and role authorization",
    async (handler, status, error) => {
      mocks.requireEmployer.mockResolvedValue({ user: null, error, status });

      const response = await handler(
        request(handler === POST ? "POST" : "PUT", validBody({ id: jobId })),
      );

      expect(response.status).toBe(status);
      expect(mocks.limit).not.toHaveBeenCalled();
    },
  );

  it.each([
    [POST, validBody({ recruiter_id: "attacker-controlled" })],
    [PUT, validBody({ id: jobId, company_id: companyId })],
    [
      POST,
      validBody({
        screeningQuestions: [
          { id: "1", question: "Authorized?", required: true, answer: "yes" },
        ],
      }),
    ],
  ] as const)("rejects unknown fields", async (handler, body) => {
    const response = await handler(
      request(handler === POST ? "POST" : "PUT", body),
    );
    expect(response.status).toBe(400);
  });

  it("rejects invalid salary ranges", async () => {
    const response = await POST(
      request("POST", validBody({ salaryMin: 200000, salaryMax: 100000 })),
    );
    expect(response.status).toBe(400);
  });

  it("rate limits job creation", async () => {
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });
    const response = await POST(request("POST", validBody()));
    expect(response.status).toBe(429);
  });

  it("creates a job for the authenticated recruiter and owned company", async () => {
    const supabase = createPostSupabase();
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });

    const response = await POST(request("POST", validBody()));

    expect(response.status).toBe(201);
    expect(supabase.company.eq).toHaveBeenCalledWith("owner_id", user.id);
    expect(supabase.job.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        recruiter_id: user.id,
        company_id: companyId,
        title: "Platform Engineer",
        status: "published",
      }),
    );
  });

  it("denies publication when the active-job entitlement is exhausted", async () => {
    mocks.loadEntitlements.mockResolvedValue({
      activeJobs: 1,
      activeJobLimit: 1,
      boostCredits: 0,
    });

    const response = await POST(request("POST", validBody()));

    expect(response.status).toBe(403);
  });

  it("returns 404 when the recruiter does not own the requested job", async () => {
    const supabase = createPutSupabase({ existingJob: null });
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });

    const response = await PUT(request("PUT", validBody({ id: jobId })));

    expect(response.status).toBe(404);
    expect(supabase.lookup.eq).toHaveBeenCalledWith("recruiter_id", user.id);
    expect(supabase.update.update).not.toHaveBeenCalled();
  });

  it("updates only the authenticated recruiter's job", async () => {
    const supabase = createPutSupabase();
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });

    const response = await PUT(request("PUT", validBody({ id: jobId })));

    expect(response.status).toBe(200);
    expect(supabase.update.eq).toHaveBeenCalledWith("id", jobId);
    expect(supabase.update.eq).toHaveBeenCalledWith("recruiter_id", user.id);
  });

  it("does not expose database errors", async () => {
    const supabase = createPostSupabase({
      companyError: { code: "DB100", message: "private database detail" },
    });
    mocks.requireEmployer.mockResolvedValue({ user, supabase, status: 200 });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const response = await POST(request("POST", validBody()));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Could not create the job." });
    expect(JSON.stringify(payload)).not.toContain("private database detail");
    consoleError.mockRestore();
  });
});
