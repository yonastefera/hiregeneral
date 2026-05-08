import { NextResponse } from "next/server";
import { getJobSourceAdapter } from "@/lib/ingest/adapters";
import {
  finishIngestionRun,
  startIngestionRun,
} from "@/lib/ingest/ingestion-runs";
import { getEnabledJobSources } from "@/lib/ingest/job-sources";
import { validateImportedJobs } from "@/lib/ingest/source";
import {
  expireStaleImportedJobs,
  upsertImportedJobs,
} from "@/lib/ingest/upsert-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SOURCE_TIMEOUT_MS = 90_000;

type SourceResult = {
  companyName: string;
  sourceType: string;
  sourceSlug: string;
  status: "success" | "failed" | "skipped";
  fetchedJobs: number;
  validJobs: number;
  rejectedJobs: number;
  upsertedJobs: number;
  expiredJobs: number;
  runId: string | null;
  error: string | null;
  rejected: Array<{
    index: number;
    sourceId?: string;
    title?: string;
    issues: string[];
  }>;
};

function missingEnvVars() {
  return [
    "INGEST_SECRET",
    "SYSTEM_RECRUITER_ID",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((name) => !process.env[name]);
}

function sourceTimeoutMs() {
  const value = Number(process.env.INGEST_SOURCE_TIMEOUT_MS);

  return Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_SOURCE_TIMEOUT_MS;
}

export async function POST(request: Request) {
  try {
    const missing = missingEnvVars();

    if (missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Missing environment variables: ${missing.join(", ")}`,
        },
        { status: 500 },
      );
    }

    const authHeader = request.headers.get("authorization");
    const expectedAuthHeader = `Bearer ${process.env.INGEST_SECRET}`;

    if (authHeader !== expectedAuthHeader) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const requestedSourceSlug = url.searchParams.get("sourceSlug");
    const requestedSourceType = url.searchParams.get("sourceType");
    const allSources = await getEnabledJobSources();
    const sources = allSources.filter((source) => {
      if (requestedSourceSlug && source.sourceSlug !== requestedSourceSlug) {
        return false;
      }

      if (requestedSourceType && source.sourceType !== requestedSourceType) {
        return false;
      }

      return true;
    });
    const sourcesResult: SourceResult[] = [];

    for (const source of sources) {
      const adapter = getJobSourceAdapter(source.sourceType);

      if (!adapter) {
        sourcesResult.push({
          companyName: source.companyName,
          sourceType: source.sourceType,
          sourceSlug: source.sourceSlug,
          status: "skipped",
          fetchedJobs: 0,
          validJobs: 0,
          rejectedJobs: 0,
          upsertedJobs: 0,
          expiredJobs: 0,
          runId: null,
          error: "Source type not implemented yet",
          rejected: [],
        });
        continue;
      }

      const sourceResult: SourceResult = {
        companyName: source.companyName,
        sourceType: source.sourceType,
        sourceSlug: source.sourceSlug,
        status: "failed",
        fetchedJobs: 0,
        validJobs: 0,
        rejectedJobs: 0,
        upsertedJobs: 0,
        expiredJobs: 0,
        runId: null,
        error: null,
        rejected: [],
      };

      try {
        const runId = await startIngestionRun(source);
        sourceResult.runId = runId;

        const abortController = new AbortController();
        const timeout = setTimeout(
          () => abortController.abort(),
          sourceTimeoutMs(),
        );

        let rawJobs;

        try {
          rawJobs = await adapter.fetchJobs(source, {
            signal: abortController.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
        const validation = validateImportedJobs(rawJobs);

        sourceResult.fetchedJobs = rawJobs.length;
        sourceResult.validJobs = validation.jobs.length;
        sourceResult.rejectedJobs = validation.rejected.length;
        sourceResult.rejected = validation.rejected.slice(0, 10);

        const upsertResult = await upsertImportedJobs(validation.jobs);
        sourceResult.upsertedJobs = upsertResult.upserted;

        const shouldExpireStale =
          validation.jobs.length > 0 || rawJobs.length === 0;

        if (shouldExpireStale) {
          const staleResult = await expireStaleImportedJobs({
            sourceName: source.sourceType,
            sourceSlug: source.sourceSlug,
            activeSourceIds: validation.jobs.map((job) => job.sourceId),
          });

          sourceResult.expiredJobs = staleResult.expired;
        }

        sourceResult.status = "success";

        await finishIngestionRun({
          runId,
          status: "success",
          fetchedJobs: sourceResult.fetchedJobs,
          validJobs: sourceResult.validJobs,
          rejectedJobs: sourceResult.rejectedJobs,
          upsertedJobs: sourceResult.upsertedJobs,
          expiredJobs: sourceResult.expiredJobs,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown source error";

        sourceResult.status = "failed";
        sourceResult.error = message;

        if (sourceResult.runId) {
          await finishIngestionRun({
            runId: sourceResult.runId,
            status: "failed",
            fetchedJobs: sourceResult.fetchedJobs,
            validJobs: sourceResult.validJobs,
            rejectedJobs: sourceResult.rejectedJobs,
            upsertedJobs: sourceResult.upsertedJobs,
            expiredJobs: sourceResult.expiredJobs,
            errorMessage: message,
          });
        }
      }

      sourcesResult.push(sourceResult);
    }

    const totals = sourcesResult.reduce(
      (acc, source) => ({
        fetchedJobs: acc.fetchedJobs + source.fetchedJobs,
        validJobs: acc.validJobs + source.validJobs,
        rejectedJobs: acc.rejectedJobs + source.rejectedJobs,
        upsertedJobs: acc.upsertedJobs + source.upsertedJobs,
        expiredJobs: acc.expiredJobs + source.expiredJobs,
        failedSources: acc.failedSources + (source.status === "failed" ? 1 : 0),
        skippedSources:
          acc.skippedSources + (source.status === "skipped" ? 1 : 0),
      }),
      {
        fetchedJobs: 0,
        validJobs: 0,
        rejectedJobs: 0,
        upsertedJobs: 0,
        expiredJobs: 0,
        failedSources: 0,
        skippedSources: 0,
      },
    );

    return NextResponse.json({
      ok: totals.failedSources === 0,
      totalSources: sources.length,
      totals,
      sources: sourcesResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown route error",
      },
      { status: 500 },
    );
  }
}
