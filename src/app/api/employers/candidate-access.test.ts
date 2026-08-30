import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCandidates: vi.fn(),
  getDatabase: vi.fn(),
  loadEntitlements: vi.fn(),
  requireEmployer: vi.fn(),
  searchLimit: vi.fn(),
}));

vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));
vi.mock("@/lib/billing/entitlements", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/billing/entitlements")>();
  return { ...original, loadEmployerEntitlements: mocks.loadEntitlements };
});
vi.mock("@/employer/dashboard/candidates/employer-candidates-data", () => ({
  getEmployerCandidates: mocks.getCandidates,
}));
vi.mock("@/employer/dashboard/database/employer-resume-database-data", () => ({
  getEmployerResumeDatabaseData: mocks.getDatabase,
}));
vi.mock("@/lib/rate-limit", () => ({
  employerCandidateSearchRateLimit: { limit: mocks.searchLimit },
}));

import { GET as candidates } from "@/app/api/employers/candidates/route";
import { GET as database } from "@/app/api/employers/database/route";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "r@test" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireEmployer.mockResolvedValue({ user, supabase: {}, status: 200 });
  mocks.loadEntitlements.mockResolvedValue({ candidateDatabase: true });
  mocks.getCandidates.mockResolvedValue({ candidates: [] });
  mocks.getDatabase.mockResolvedValue({ candidates: [] });
  mocks.searchLimit.mockResolvedValue({ success: true });
});

describe("employer candidate access", () => {
  it.each([candidates, database])(
    "requires an employer role",
    async (handler) => {
      mocks.requireEmployer.mockResolvedValue({
        user: null,
        error: "Employer role required",
        status: 403,
      });
      const response = await handler(
        new NextRequest("https://www.hiregeneral.com/api/employers/resource"),
      );
      expect(response.status).toBe(403);
    },
  );

  it("scopes applicant access to the authenticated recruiter", async () => {
    const response = await candidates(
      new NextRequest("https://www.hiregeneral.com/api/employers/candidates"),
    );
    expect(response.status).toBe(200);
    expect(mocks.getCandidates).toHaveBeenCalledWith(
      expect.objectContaining({ recruiterId: user.id }),
    );
  });

  it("accepts the all-jobs filter used by the candidates dashboard", async () => {
    const response = await candidates(
      new NextRequest(
        "https://www.hiregeneral.com/api/employers/candidates?jobId=all",
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.getCandidates).toHaveBeenCalledWith(
      expect.objectContaining({ recruiterId: user.id, jobId: "all" }),
    );
  });

  it("requires a paid candidate-database entitlement", async () => {
    mocks.loadEntitlements.mockResolvedValue({ candidateDatabase: false });
    const response = await database(
      new NextRequest("https://www.hiregeneral.com/api/employers/database"),
    );
    expect(response.status).toBe(403);
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("scopes resume search to the authenticated recruiter", async () => {
    const response = await database(
      new NextRequest(
        "https://www.hiregeneral.com/api/employers/database?resumeOnly=true",
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.getDatabase).toHaveBeenCalledWith(
      expect.objectContaining({ recruiterId: user.id, resumeOnly: true }),
    );
  });

  it("returns safe errors when candidate loading fails", async () => {
    mocks.getCandidates.mockRejectedValue(new Error("private database detail"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const response = await candidates(
      new NextRequest("https://www.hiregeneral.com/api/employers/candidates"),
    );
    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(JSON.stringify(payload)).not.toContain("private database detail");
    consoleError.mockRestore();
  });
});
