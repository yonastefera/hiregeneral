import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IngestionRunRow = {
  id: string;
  source_name: string;
  source_slug: string;
  company_name: string;
  status: "running" | "success" | "failed";
  fetched_jobs: number;
  valid_jobs: number;
  rejected_jobs: number;
  upserted_jobs: number;
  expired_jobs: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

type JobSourceRow = {
  company_name: string;
  source_type: string;
  source_slug: string;
  enabled: boolean;
};

type JobMonitorRow = {
  company_name: string;
  expires_at: string | null;
  posted_at: string | null;
  status: string;
};

type SourceMonitorStatus =
  | IngestionRunRow["status"]
  | "missing"
  | "stale_running";

const JOB_STATS_PAGE_SIZE = 1000;
const STALE_RUNNING_AFTER_MS = 30 * 60 * 1000;

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function parseDateParam(value: string | null) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const [, year, month, day] = match;

  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

function resolveWindow(searchParams: URLSearchParams) {
  const now = new Date();
  const window = searchParams.get("window");

  if (window === "24h") {
    return {
      label: "last_24_hours",
      start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      end: now,
    };
  }

  const requestedDate = parseDateParam(searchParams.get("date"));
  const start =
    requestedDate ?? startOfUtcDay(new Date(now.getTime() - 86_400_000));
  const end = new Date(start.getTime() + 86_400_000);

  return {
    label: requestedDate ? "date" : "yesterday",
    start,
    end,
  };
}

function sourceKey(sourceName: string, sourceSlug: string) {
  return `${sourceName}:${sourceSlug}`;
}

function timeValue(value: string | null) {
  if (!value) return null;

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? null : time;
}

function isActivePublishedJob(job: JobMonitorRow, nowTime: number) {
  const expiresAt = timeValue(job.expires_at);

  return (
    job.status === "published" && (expiresAt === null || expiresAt > nowTime)
  );
}

function isExpiredPublishedJob(job: JobMonitorRow, nowTime: number) {
  const expiresAt = timeValue(job.expires_at);

  return (
    job.status === "published" && expiresAt !== null && expiresAt < nowTime
  );
}

function isWithinWindow(
  value: string | null,
  startTime: number,
  endTime: number,
) {
  const time = timeValue(value);

  return time !== null && time >= startTime && time < endTime;
}

function isSince(value: string | null, startTime: number) {
  const time = timeValue(value);

  return time !== null && time >= startTime;
}

function isStaleRunningRun(run: IngestionRunRow, nowTime: number) {
  const startedAt = timeValue(run.started_at);

  return (
    run.status === "running" &&
    startedAt !== null &&
    nowTime - startedAt > STALE_RUNNING_AFTER_MS
  );
}

async function getExactCount(
  query: ReturnType<ReturnType<typeof createClient>["from"]>["select"],
) {
  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getImportedJobMonitorRows(supabase: SupabaseClient) {
  const rows: JobMonitorRow[] = [];

  for (let from = 0; ; from += JOB_STATS_PAGE_SIZE) {
    const to = from + JOB_STATS_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("jobs")
      .select("company_name, expires_at, posted_at, status")
      .not("source_name", "is", null)
      .order("company_name", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Could not load imported job counts: ${error.message}`);
    }

    const pageRows = (data ?? []) as JobMonitorRow[];
    rows.push(...pageRows);

    if (pageRows.length < JOB_STATS_PAGE_SIZE) break;
  }

  return rows;
}

export async function GET(request: Request) {
  try {
    const ingestSecret = requireEnv("INGEST_SECRET");
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${ingestSecret}`) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const supabase = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { searchParams } = new URL(request.url);
    const range = resolveWindow(searchParams);
    const now = new Date();
    const nowIso = now.toISOString();
    const nowTime = now.getTime();
    const last24hTime = now.getTime() - 24 * 60 * 60 * 1000;
    const last7dTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const startIso = range.start.toISOString();
    const endIso = range.end.toISOString();
    const startTime = range.start.getTime();
    const endTime = range.end.getTime();

    const [
      { data: sources, error: sourcesError },
      { data: runs, error: runsError },
    ] = await Promise.all([
      supabase
        .from("job_sources")
        .select("company_name, source_type, source_slug, enabled")
        .order("company_name", { ascending: true }),
      supabase
        .from("job_ingestion_runs")
        .select(
          [
            "id",
            "source_name",
            "source_slug",
            "company_name",
            "status",
            "fetched_jobs",
            "valid_jobs",
            "rejected_jobs",
            "upserted_jobs",
            "expired_jobs",
            "error_message",
            "started_at",
            "finished_at",
          ].join(","),
        )
        .gte("started_at", startIso)
        .lt("started_at", endIso)
        .order("started_at", { ascending: false }),
    ]);

    if (sourcesError) {
      throw new Error(`Could not load job sources: ${sourcesError.message}`);
    }

    if (runsError) {
      throw new Error(`Could not load ingestion runs: ${runsError.message}`);
    }

    const sourceRows = (sources ?? []) as JobSourceRow[];
    const runRows = (runs ?? []) as unknown as IngestionRunRow[];
    const enabledSources = sourceRows.filter((source) => source.enabled);

    const runsBySource = new Map<string, IngestionRunRow[]>();

    for (const run of runRows) {
      const key = sourceKey(run.source_name, run.source_slug);
      const existing = runsBySource.get(key) ?? [];
      existing.push(run);
      runsBySource.set(key, existing);
    }

    const sourceHealth = enabledSources.map((source) => {
      const key = sourceKey(source.source_type, source.source_slug);
      const sourceRuns = runsBySource.get(key) ?? [];
      const latestRun = sourceRuns[0] ?? null;
      const failedRuns = sourceRuns.filter((run) => run.status === "failed");
      const staleRunningRuns = sourceRuns.filter((run) =>
        isStaleRunningRun(run, nowTime),
      );
      const runningRuns = sourceRuns.filter(
        (run) => run.status === "running" && !isStaleRunningRun(run, nowTime),
      );
      const successfulRuns = sourceRuns.filter(
        (run) => run.status === "success",
      );
      const status: SourceMonitorStatus = latestRun
        ? isStaleRunningRun(latestRun, nowTime)
          ? "stale_running"
          : latestRun.status
        : "missing";
      const healthy = status === "success";

      return {
        companyName: source.company_name,
        sourceType: source.source_type,
        sourceSlug: source.source_slug,
        healthy,
        status,
        runCount: sourceRuns.length,
        successCount: successfulRuns.length,
        failedCount: failedRuns.length,
        runningCount: runningRuns.length,
        staleRunningCount: staleRunningRuns.length,
        latestRun,
        lastError: failedRuns[0]?.error_message ?? null,
      };
    });

    const totals = runRows.reduce(
      (acc, run) => ({
        fetchedJobs: acc.fetchedJobs + run.fetched_jobs,
        validJobs: acc.validJobs + run.valid_jobs,
        rejectedJobs: acc.rejectedJobs + run.rejected_jobs,
        upsertedJobs: acc.upsertedJobs + run.upserted_jobs,
        expiredJobs: acc.expiredJobs + run.expired_jobs,
        successfulRuns: acc.successfulRuns + (run.status === "success" ? 1 : 0),
        failedRuns: acc.failedRuns + (run.status === "failed" ? 1 : 0),
        runningRuns:
          acc.runningRuns +
          (run.status === "running" && !isStaleRunningRun(run, nowTime)
            ? 1
            : 0),
        staleRunningRuns:
          acc.staleRunningRuns + (isStaleRunningRun(run, nowTime) ? 1 : 0),
      }),
      {
        fetchedJobs: 0,
        validJobs: 0,
        rejectedJobs: 0,
        upsertedJobs: 0,
        expiredJobs: 0,
        successfulRuns: 0,
        failedRuns: 0,
        runningRuns: 0,
        staleRunningRuns: 0,
      },
    );

    const [activeImportedJobs, expiredImportedJobs, importedJobs] =
      await Promise.all([
        getExactCount(
          supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .not("source_name", "is", null)
            .eq("status", "published")
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
        ),
        getExactCount(
          supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .not("source_name", "is", null)
            .lt("expires_at", nowIso),
        ),
        getImportedJobMonitorRows(supabase),
      ]);

    const companyStats = new Map<
      string,
      {
        companyName: string;
        publishedJobs: number;
        newJobsInWindow: number;
        newJobs24h: number;
        newJobs7d: number;
        expiredJobs: number;
        latestPostedAt: string | null;
      }
    >();

    for (const job of importedJobs) {
      const current = companyStats.get(job.company_name) ?? {
        companyName: job.company_name,
        publishedJobs: 0,
        newJobsInWindow: 0,
        newJobs24h: 0,
        newJobs7d: 0,
        expiredJobs: 0,
        latestPostedAt: null,
      };

      if (isActivePublishedJob(job, nowTime)) {
        current.publishedJobs += 1;

        if (isWithinWindow(job.posted_at, startTime, endTime)) {
          current.newJobsInWindow += 1;
        }

        if (isSince(job.posted_at, last24hTime)) {
          current.newJobs24h += 1;
        }

        if (isSince(job.posted_at, last7dTime)) {
          current.newJobs7d += 1;
        }
      } else if (isExpiredPublishedJob(job, nowTime)) {
        current.expiredJobs += 1;
      }

      if (
        job.posted_at &&
        (!current.latestPostedAt || job.posted_at > current.latestPostedAt)
      ) {
        current.latestPostedAt = job.posted_at;
      }

      companyStats.set(job.company_name, current);
    }

    const companies = [...companyStats.values()].sort(
      (a, b) =>
        b.publishedJobs - a.publishedJobs ||
        a.companyName.localeCompare(b.companyName),
    );
    const unhealthySources = sourceHealth.filter((source) => !source.healthy);
    const ok = unhealthySources.length === 0;

    return NextResponse.json({
      ok,
      window: {
        label: range.label,
        timezone: "UTC",
        start: startIso,
        end: endIso,
      },
      totals: {
        enabledSources: enabledSources.length,
        sourcesWithRuns: sourceHealth.filter((source) => source.runCount > 0)
          .length,
        unhealthySources: unhealthySources.length,
        runs: runRows.length,
        ...totals,
        activeImportedJobs,
        expiredImportedJobs,
        companiesWithPublishedJobs: companies.filter(
          (company) => company.publishedJobs > 0,
        ).length,
      },
      sources: sourceHealth,
      companies,
      topNewCompanies: companies
        .filter((company) => company.newJobsInWindow > 0)
        .sort(
          (a, b) =>
            b.newJobsInWindow - a.newJobsInWindow ||
            a.companyName.localeCompare(b.companyName),
        )
        .slice(0, 10),
      failures: unhealthySources.map((source) => ({
        companyName: source.companyName,
        sourceType: source.sourceType,
        sourceSlug: source.sourceSlug,
        status: source.status,
        error: source.lastError,
      })),
      staleRunningRuns: sourceHealth
        .filter((source) => source.staleRunningCount > 0)
        .map((source) => ({
          companyName: source.companyName,
          sourceType: source.sourceType,
          sourceSlug: source.sourceSlug,
          staleRunningCount: source.staleRunningCount,
        })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown monitor error",
      },
      { status: 500 },
    );
  }
}
