import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  getPreviousSuccessfulJobCount: vi.fn(),
  getPublishedImportedJobCount: vi.fn(),
  getSources: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  ingestionRateLimit: { limit: mocks.limit },
}));
vi.mock("@/lib/security/audit", () => ({
  recordPrivilegedAction: mocks.audit,
}));
vi.mock("@/lib/ingest/job-sources", () => ({
  getEnabledJobSources: mocks.getSources,
}));
vi.mock("@/lib/ingest/adapters", () => ({ getJobSourceAdapter: vi.fn() }));
vi.mock("@/lib/ingest/job-detail-extractor", () => ({
  enhanceImportedJobFromDetailPage: vi.fn(),
}));
vi.mock("@/lib/ingest/ingestion-runs", () => ({
  startIngestionRun: vi.fn(),
  finishIngestionRun: vi.fn(),
  getPreviousSuccessfulJobCount: mocks.getPreviousSuccessfulJobCount,
}));
vi.mock("@/lib/ingest/source", () => ({ validateImportedJobs: vi.fn() }));
vi.mock("@/lib/ingest/upsert-jobs", () => ({
  expireStaleImportedJobs: vi.fn(),
  getPublishedImportedJobCount: mocks.getPublishedImportedJobCount,
  upsertImportedJobs: vi.fn(),
}));

import { POST } from "@/app/api/ingest/jobs/route";

function request(secret = "ingest-secret", query = "") {
  return new Request(`https://www.hiregeneral.com/api/ingest/jobs${query}`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.INGEST_SECRET = "ingest-secret";
  process.env.SYSTEM_RECRUITER_ID = "11111111-1111-4111-8111-111111111111";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  mocks.limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });
  mocks.getSources.mockResolvedValue([]);
  mocks.getPreviousSuccessfulJobCount.mockResolvedValue(null);
  mocks.getPublishedImportedJobCount.mockResolvedValue(0);
  mocks.audit.mockResolvedValue(undefined);
});

afterEach(() => {
  delete process.env.INGEST_SECRET;
  delete process.env.SYSTEM_RECRUITER_ID;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe("POST /api/ingest/jobs", () => {
  it("rejects unauthorized ingestion", async () => {
    const response = await POST(request("wrong-secret"));
    expect(response.status).toBe(401);
    expect(mocks.getSources).not.toHaveBeenCalled();
  });

  it("rate limits authorized ingestion", async () => {
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });
    const response = await POST(request());
    expect(response.status).toBe(429);
  });

  it("rejects invalid ingestion filters", async () => {
    const response = await POST(
      request("ingest-secret", `?sourceSlug=${"x".repeat(121)}`),
    );
    expect(response.status).toBe(400);
  });

  it("completes an empty ingestion and records an audit event", async () => {
    const response = await POST(request());
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.totalSources).toBe(0);
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "admin.job_ingestion_completed" }),
    );
  });

  it("returns a safe error when ingestion fails", async () => {
    mocks.getSources.mockRejectedValue(new Error("private provider detail"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const response = await POST(request());
    const payload = await response.json();
    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Job ingestion failed." });
    expect(JSON.stringify(payload)).not.toContain("private provider detail");
    consoleError.mockRestore();
  });
});
