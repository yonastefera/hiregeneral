import { getJobSourceAdapter } from "./adapters";
import { validateApplyLinks } from "./apply-link-validator";
import { enhanceImportedJobFromDetailPage } from "./job-detail-extractor";
import { validateJobFreshness } from "./freshness-validator";
import {
  finishIngestionRun,
  getPreviousSuccessfulJobCount,
  recordIngestionDeadLetter,
  resolveIngestionDeadLetters,
  startIngestionRun,
} from "./ingestion-runs";
import type { JobSource } from "./job-sources";
import { withRetry } from "./retry";
import { deduplicateImportedJobs, validateImportedJobs } from "./source";
import {
  getPublishedImportedJobCount,
  publishStagedImportedJobs,
  stageImportedJobs,
} from "./upsert-jobs";
import { evaluateIngestionVolume } from "./volume-guard";
import { redactLogValue } from "@/lib/logging/redact";

const DEFAULT_SOURCE_TIMEOUT_MS = 90_000;
const DEFAULT_DETAIL_CONCURRENCY = 3;
const DEFAULT_MAX_ATTEMPTS = 3;

export type SourceResult = {
  companyName: string;
  sourceType: string;
  sourceSlug: string;
  status: "success" | "failed" | "skipped";
  attempts: number;
  fetchedJobs: number;
  validJobs: number;
  rejectedJobs: number;
  applyLinksChecked: number;
  applyLinkIssues: number;
  upsertedJobs: number;
  expiredJobs: number;
  staleExpirationSkipped: boolean;
  staleExpirationReason: string | null;
  runId: string | null;
  error: string | null;
  rejected: Array<{
    index: number;
    sourceId?: string;
    title?: string;
    issues: string[];
  }>;
};

function metadataNumber(source: JobSource, key: string) {
  const value = source.metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function boundedInteger(
  value: number | null,
  fallback: number,
  maximum: number,
) {
  return Math.min(Math.max(Math.floor(value ?? fallback), 1), maximum);
}

function sourceTimeoutMs(source: JobSource) {
  const configured = metadataNumber(source, "sourceTimeoutMs");
  const environment = Number(process.env.INGEST_SOURCE_TIMEOUT_MS);

  if (configured && configured > 0) return configured;
  return Number.isFinite(environment) && environment > 0
    ? environment
    : DEFAULT_SOURCE_TIMEOUT_MS;
}

function initialResult(source: JobSource): SourceResult {
  return {
    companyName: source.companyName,
    sourceType: source.sourceType,
    sourceSlug: source.sourceSlug,
    status: "failed",
    attempts: 0,
    fetchedJobs: 0,
    validJobs: 0,
    rejectedJobs: 0,
    applyLinksChecked: 0,
    applyLinkIssues: 0,
    upsertedJobs: 0,
    expiredJobs: 0,
    staleExpirationSkipped: false,
    staleExpirationReason: null,
    runId: null,
    error: null,
    rejected: [],
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

async function fetchSourceJobs(source: JobSource, signal: AbortSignal) {
  const adapter = getJobSourceAdapter(source.sourceType);
  if (!adapter) throw new Error("Source type not implemented yet");

  const jobs = await adapter.fetchJobs(source, { signal });
  if (source.metadata.enhanceDetails === false || jobs.length === 0)
    return jobs;

  const concurrency = boundedInteger(
    metadataNumber(source, "detailEnhancementConcurrency"),
    DEFAULT_DETAIL_CONCURRENCY,
    8,
  );

  return mapWithConcurrency(jobs, concurrency, (job) =>
    enhanceImportedJobFromDetailPage({
      job,
      detailUrl: job.applyUrl,
      signal,
    }),
  );
}

async function fetchSourceAttempt(source: JobSource) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), sourceTimeoutMs(source));

  try {
    return await fetchSourceJobs(source, controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

function errorCode(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "source_timeout";
  }
  return "source_execution_failed";
}

export async function runSourceWorker(
  source: JobSource,
): Promise<SourceResult> {
  const adapter = getJobSourceAdapter(source.sourceType);
  const result = initialResult(source);

  if (!adapter) {
    return {
      ...result,
      status: "skipped",
      error: "Source type not implemented yet",
    };
  }

  let attempts = 0;

  try {
    result.runId = await startIngestionRun(source);
    const [previousValidJobs, publishedJobs] = await Promise.all([
      getPreviousSuccessfulJobCount(source),
      getPublishedImportedJobCount({
        sourceName: source.sourceType,
        sourceSlug: source.sourceSlug,
      }),
    ]);
    const retryResult = await withRetry(
      async (attempt) => {
        attempts = attempt;
        return fetchSourceAttempt(source);
      },
      {
        policy: {
          maxAttempts: boundedInteger(
            metadataNumber(source, "maxAttempts"),
            Number(process.env.INGEST_MAX_ATTEMPTS) || DEFAULT_MAX_ATTEMPTS,
            5,
          ),
        },
      },
    );
    const rawJobs = retryResult.value;
    result.attempts = retryResult.attempts;

    const validation = validateImportedJobs(rawJobs);
    const deduplicated = deduplicateImportedJobs(validation.jobs);
    const freshness = validateJobFreshness(deduplicated.jobs);
    const validateRemoteLinks = source.metadata.validateApplyLinks !== false;
    const linkValidation = await validateApplyLinks(freshness.jobs, {
      probeLimit: validateRemoteLinks
        ? Math.max(metadataNumber(source, "applyLinkValidationLimit") ?? 20, 0)
        : 0,
      timeoutMs: metadataNumber(source, "applyLinkTimeoutMs") ?? 5_000,
    });

    result.fetchedJobs = rawJobs.length;
    result.validJobs = linkValidation.jobs.length;
    result.rejectedJobs =
      validation.rejected.length +
      deduplicated.duplicateCount +
      freshness.issues.length +
      linkValidation.issues.filter((issue) => issue.reason !== "unreachable")
        .length;
    result.applyLinksChecked = linkValidation.checked;
    result.applyLinkIssues = linkValidation.issues.length;
    result.rejected = validation.rejected.slice(0, 10);

    const volumeDecision = evaluateIngestionVolume({
      source,
      currentValidJobs: linkValidation.jobs.length,
      previousValidJobs,
      publishedJobs,
    });
    result.staleExpirationSkipped = !volumeDecision.allowStaleExpiration;
    result.staleExpirationReason = volumeDecision.reason;

    await stageImportedJobs({
      runId: result.runId,
      sourceName: source.sourceType,
      sourceSlug: source.sourceSlug,
      jobs: linkValidation.jobs,
    });
    const published = await publishStagedImportedJobs({
      runId: result.runId,
      expireStale: volumeDecision.allowStaleExpiration,
    });
    result.upsertedJobs = published.upserted;
    result.expiredJobs = published.expired;
    result.status = "success";

    await finishIngestionRun({
      runId: result.runId,
      status: "success",
      fetchedJobs: result.fetchedJobs,
      validJobs: result.validJobs,
      rejectedJobs: result.rejectedJobs,
      upsertedJobs: result.upsertedJobs,
      expiredJobs: result.expiredJobs,
      attemptCount: result.attempts,
      retryCount: Math.max(0, result.attempts - 1),
      qualityMetrics: {
        applyLinksChecked: result.applyLinksChecked,
        applyLinkIssues: result.applyLinkIssues,
        freshnessIssues: freshness.issues.length,
        duplicateJobs: deduplicated.duplicateCount,
        rejectionRate:
          result.fetchedJobs > 0 ? result.rejectedJobs / result.fetchedJobs : 0,
        staleExpirationSkipped: result.staleExpirationSkipped,
        staleExpirationReason: result.staleExpirationReason,
      },
    });
    await resolveIngestionDeadLetters(source).catch(() => undefined);
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Unknown source error";
    const message = String(redactLogValue(rawMessage)).slice(0, 1_000);
    result.attempts = Math.max(attempts, 1);
    result.status = "failed";
    result.error = message;

    if (result.runId) {
      await Promise.allSettled([
        recordIngestionDeadLetter({
          runId: result.runId,
          source,
          attemptCount: result.attempts,
          errorCode: errorCode(error),
          errorMessage: message,
          context: {
            fetchedJobs: result.fetchedJobs,
            validJobs: result.validJobs,
            rejectedJobs: result.rejectedJobs,
          },
        }),
        finishIngestionRun({
          runId: result.runId,
          status: "failed",
          fetchedJobs: result.fetchedJobs,
          validJobs: result.validJobs,
          rejectedJobs: result.rejectedJobs,
          upsertedJobs: result.upsertedJobs,
          expiredJobs: result.expiredJobs,
          attemptCount: result.attempts,
          retryCount: Math.max(0, result.attempts - 1),
          deadLettered: true,
          errorMessage: message,
        }),
      ]);
    }
  }

  return result;
}

export async function runSourceWorkers(
  sources: JobSource[],
  concurrency: number,
) {
  return mapWithConcurrency(
    sources,
    Math.max(1, Math.min(Math.floor(concurrency), 10)),
    runSourceWorker,
  );
}
