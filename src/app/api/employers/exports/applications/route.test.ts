import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireEmployer: vi.fn(),
  audit: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));
vi.mock("@/lib/security/audit", () => ({
  recordPrivilegedAction: mocks.audit,
}));
vi.mock("@/lib/rate-limit", () => ({
  employerExportRateLimit: { limit: mocks.rateLimit },
}));

import { GET } from "./route";

function request(query = "format=csv&jobId=all") {
  return new NextRequest(
    `http://localhost/api/employers/exports/applications?${query}`,
  );
}

function employerClient(params: {
  role?: "owner" | "admin" | "interviewer";
  applications?: Record<string, unknown>[];
}) {
  const membership = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data:
        params.role === "owner" || params.role === "admin"
          ? {
              company_id: "11111111-1111-4111-8111-111111111111",
              role: params.role,
            }
          : null,
      error: null,
    }),
  };
  const applications = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: params.applications ?? [], error: null }).then(
        resolve,
      ),
  };

  return {
    from: vi.fn((table: string) =>
      table === "employer_team_members" ? membership : applications,
    ),
  };
}

describe("GET employer application export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ success: true });
  });

  it("requires an employer account", async () => {
    mocks.requireEmployer.mockResolvedValue({
      user: null,
      error: "Unauthorized",
      status: 401,
    });

    expect((await GET(request())).status).toBe(401);
  });

  it("rejects invalid export parameters", async () => {
    mocks.requireEmployer.mockResolvedValue({
      user: { id: "user-1" },
      supabase: employerClient({ role: "owner" }),
    });

    expect((await GET(request("format=xml&jobId=all"))).status).toBe(400);
  });

  it("limits exports to owners and administrators", async () => {
    mocks.requireEmployer.mockResolvedValue({
      user: { id: "user-1" },
      supabase: employerClient({ role: "interviewer" }),
    });

    expect((await GET(request())).status).toBe(403);
  });

  it("returns protected CSV and records an audit event", async () => {
    const row = {
      id: "application-1",
      job_id: "job-1",
      applicant_full_name: "=DANGEROUS()",
      applicant_email: "candidate@example.com",
      applicant_phone: null,
      applicant_location: "New York",
      applicant_linkedin: null,
      applicant_portfolio: null,
      years_experience: "2-4",
      work_authorization: "citizen",
      requires_sponsorship: "no",
      status: "reviewing",
      created_at: "2026-08-30T12:00:00.000Z",
      updated_at: "2026-08-30T13:00:00.000Z",
      jobs: { title: "Engineer" },
      employer_pipeline_stages: { name: "Review" },
    };
    mocks.requireEmployer.mockResolvedValue({
      user: { id: "user-1" },
      supabase: employerClient({ role: "owner", applications: [row] }),
    });

    const response = await GET(request());
    const csv = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(csv).toContain("'=DANGEROUS()");
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "employer.applications_exported",
        targetType: "company",
      }),
    );
  });
});
