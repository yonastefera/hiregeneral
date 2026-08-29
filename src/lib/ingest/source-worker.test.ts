import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobSource } from "./job-sources";
import type { ImportedJob } from "./normalize";

const mocks = vi.hoisted(() => ({
  adapter: { fetchJobs: vi.fn() },
  deadLetter: vi.fn(),
  enhance: vi.fn(),
  finishRun: vi.fn(),
  getPreviousCount: vi.fn(),
  getPublishedCount: vi.fn(),
  publish: vi.fn(),
  resolveDeadLetters: vi.fn(),
  stage: vi.fn(),
  startRun: vi.fn(),
  validate: vi.fn(),
  validateLinks: vi.fn(),
}));

vi.mock("./adapters", () => ({ getJobSourceAdapter: () => mocks.adapter }));
vi.mock("./apply-link-validator", () => ({
  validateApplyLinks: mocks.validateLinks,
}));
vi.mock("./job-detail-extractor", () => ({
  enhanceImportedJobFromDetailPage: mocks.enhance,
}));
vi.mock("./ingestion-runs", () => ({
  finishIngestionRun: mocks.finishRun,
  getPreviousSuccessfulJobCount: mocks.getPreviousCount,
  recordIngestionDeadLetter: mocks.deadLetter,
  resolveIngestionDeadLetters: mocks.resolveDeadLetters,
  startIngestionRun: mocks.startRun,
}));
vi.mock("./source", () => ({
  deduplicateImportedJobs: (jobs: ImportedJob[]) => ({
    jobs,
    duplicateCount: 0,
  }),
  validateImportedJobs: mocks.validate,
}));
vi.mock("./upsert-jobs", () => ({
  getPublishedImportedJobCount: mocks.getPublishedCount,
  publishStagedImportedJobs: mocks.publish,
  stageImportedJobs: mocks.stage,
}));

import { runSourceWorker, runSourceWorkers } from "./source-worker";

const source: JobSource = {
  id: "source-id",
  companyName: "Acme",
  companyDomain: "example.com",
  metadata: { enhanceDetails: false, validateApplyLinks: false },
  sourceType: "greenhouse",
  sourceSlug: "acme",
  enabled: true,
};

const importedJob = {
  sourceId: "acme:1",
  applyUrl: "https://example.com/jobs/1",
} as ImportedJob;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.startRun.mockResolvedValue("run-id");
  mocks.getPreviousCount.mockResolvedValue(1);
  mocks.getPublishedCount.mockResolvedValue(1);
  mocks.adapter.fetchJobs.mockResolvedValue([importedJob]);
  mocks.validate.mockReturnValue({ jobs: [importedJob], rejected: [] });
  mocks.validateLinks.mockResolvedValue({
    jobs: [importedJob],
    issues: [],
    checked: 0,
  });
  mocks.stage.mockResolvedValue({ staged: 1 });
  mocks.publish.mockResolvedValue({ upserted: 1, expired: 0 });
  mocks.finishRun.mockResolvedValue(undefined);
  mocks.deadLetter.mockResolvedValue(undefined);
  mocks.resolveDeadLetters.mockResolvedValue(undefined);
});

describe("runSourceWorker", () => {
  it("stages and atomically publishes a successful source", async () => {
    const result = await runSourceWorker(source);

    expect(result.status).toBe("success");
    expect(result.attempts).toBe(1);
    expect(mocks.stage).toHaveBeenCalledWith(
      expect.objectContaining({ runId: "run-id", jobs: [importedJob] }),
    );
    expect(mocks.publish).toHaveBeenCalledWith({
      runId: "run-id",
      expireStale: true,
    });
    expect(mocks.finishRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: "success", attemptCount: 1 }),
    );
    expect(mocks.resolveDeadLetters).toHaveBeenCalledWith(source);
  });

  it("bounds concurrent source execution", async () => {
    let active = 0;
    let maximumActive = 0;
    mocks.adapter.fetchJobs.mockImplementation(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return [importedJob];
    });
    const sources = Array.from({ length: 5 }, (_, index) => ({
      ...source,
      id: `source-${index}`,
      sourceSlug: `acme-${index}`,
    }));

    const results = await runSourceWorkers(sources, 2);

    expect(results).toHaveLength(5);
    expect(maximumActive).toBe(2);
  });

  it("retries and dead-letters an exhausted source", async () => {
    mocks.adapter.fetchJobs.mockRejectedValue(new Error("provider offline"));
    const failureSource = {
      ...source,
      metadata: { ...source.metadata, maxAttempts: 1 },
    };

    const result = await runSourceWorker(failureSource);

    expect(result.status).toBe("failed");
    expect(result.error).toBe("provider offline");
    expect(mocks.deadLetter).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: "run-id",
        attemptCount: 1,
        errorCode: "source_execution_failed",
      }),
    );
    expect(mocks.finishRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", deadLettered: true }),
    );
  });
});
