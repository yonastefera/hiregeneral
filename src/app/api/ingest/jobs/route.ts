import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceRateLimit,
  logServerError,
  requestIp,
  safeServerError,
} from "@/lib/http/api-security";
import { getEnabledJobSources } from "@/lib/ingest/job-sources";
import { runSourceWorkers } from "@/lib/ingest/source-worker";
import { ingestionRateLimit } from "@/lib/rate-limit";
import { recordPrivilegedAction } from "@/lib/security/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SOURCE_CONCURRENCY = 3;

const ingestionQuerySchema = z.object({
  sourceSlug: z.string().trim().min(1).max(120).nullable(),
  sourceType: z.string().trim().min(1).max(80).nullable(),
});

function missingEnvVars() {
  return [
    "SYSTEM_RECRUITER_ID",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((name) => !process.env[name]);
}

function expectedAuthHeaders() {
  return [process.env.INGEST_SECRET, process.env.CRON_SECRET]
    .filter(Boolean)
    .map((secret) => `Bearer ${secret}`);
}

function isVercelCronRequest(request: Request) {
  return (
    process.env.VERCEL === "1" && request.headers.get("x-vercel-cron") === "1"
  );
}

function sourceConcurrency() {
  const configured = Number(process.env.INGEST_SOURCE_CONCURRENCY);
  return Number.isInteger(configured) && configured > 0
    ? Math.min(configured, 10)
    : DEFAULT_SOURCE_CONCURRENCY;
}

async function runJobsIngestion(request: Request) {
  try {
    const missing = missingEnvVars();
    const authHeaders = expectedAuthHeaders();
    const isCronRequest = isVercelCronRequest(request);

    if (authHeaders.length === 0 && !isCronRequest) {
      logServerError("ingestion_auth_not_configured", null);
      return safeServerError("Job ingestion is unavailable.");
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeaders.includes(authHeader ?? "") && !isCronRequest) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const limited = await enforceRateLimit({
      limiter: ingestionRateLimit,
      key: requestIp(request),
      context: "job_ingestion",
    });
    if (limited) return limited;

    if (missing.length > 0) {
      logServerError("ingestion_environment_incomplete", null);
      return safeServerError("Job ingestion is unavailable.");
    }

    const url = new URL(request.url);
    const parsedQuery = ingestionQuerySchema.safeParse({
      sourceSlug: url.searchParams.get("sourceSlug"),
      sourceType: url.searchParams.get("sourceType"),
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Invalid ingestion filters." },
        { status: 400 },
      );
    }

    const { sourceSlug, sourceType } = parsedQuery.data;
    const allSources = await getEnabledJobSources();
    const sources = allSources.filter(
      (source) =>
        (!sourceSlug || source.sourceSlug === sourceSlug) &&
        (!sourceType || source.sourceType === sourceType),
    );
    const concurrency = sourceConcurrency();
    const sourcesResult = await runSourceWorkers(sources, concurrency);
    const totals = sourcesResult.reduce(
      (acc, source) => ({
        fetchedJobs: acc.fetchedJobs + source.fetchedJobs,
        validJobs: acc.validJobs + source.validJobs,
        rejectedJobs: acc.rejectedJobs + source.rejectedJobs,
        applyLinksChecked: acc.applyLinksChecked + source.applyLinksChecked,
        applyLinkIssues: acc.applyLinkIssues + source.applyLinkIssues,
        upsertedJobs: acc.upsertedJobs + source.upsertedJobs,
        expiredJobs: acc.expiredJobs + source.expiredJobs,
        retries: acc.retries + Math.max(0, source.attempts - 1),
        failedSources: acc.failedSources + (source.status === "failed" ? 1 : 0),
        skippedSources:
          acc.skippedSources + (source.status === "skipped" ? 1 : 0),
      }),
      {
        fetchedJobs: 0,
        validJobs: 0,
        rejectedJobs: 0,
        applyLinksChecked: 0,
        applyLinkIssues: 0,
        upsertedJobs: 0,
        expiredJobs: 0,
        retries: 0,
        failedSources: 0,
        skippedSources: 0,
      },
    );

    await recordPrivilegedAction({
      action: "admin.job_ingestion_completed",
      targetType: "job_ingestion",
      targetId: sourceSlug ?? sourceType ?? "all",
      metadata: { totalSources: sources.length, concurrency, ...totals },
    });

    return NextResponse.json({
      ok: totals.failedSources === 0,
      totalSources: sources.length,
      concurrency,
      totals,
      sources: sourcesResult,
    });
  } catch (error) {
    logServerError("job_ingestion_failed", error);
    return safeServerError("Job ingestion failed.");
  }
}

export async function GET(request: Request) {
  return runJobsIngestion(request);
}

export async function POST(request: Request) {
  return runJobsIngestion(request);
}
