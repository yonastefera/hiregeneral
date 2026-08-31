import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  freshnessCheck,
  OPERATIONS_THRESHOLDS,
  overallHealth,
  type OperationalCheck,
  type OperationsSnapshot,
} from "./health";

type SavedSearchAlertRow = {
  alert_frequency: "daily" | "weekly";
  created_at: string;
  last_alerted_at: string | null;
};

function hoursForAlertFrequency(frequency: "daily" | "weekly") {
  return frequency === "daily" ? 24 : 168;
}

export async function loadOperationsSnapshot(
  now = new Date(),
): Promise<OperationsSnapshot> {
  const admin = createSupabaseAdminClient();
  const nowIso = now.toISOString();
  const last24Hours = new Date(now.getTime() - 86_400_000).toISOString();
  const databaseStartedAt = performance.now();

  const [
    jobsResult,
    ingestionResult,
    failedRunsResult,
    deadLettersResult,
    alertSearchesResult,
    applicationsResult,
  ] = await Promise.all([
    admin
      .from("jobs")
      .select("posted_at", { count: "exact" })
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("posted_at", { ascending: false })
      .limit(1),
    admin
      .from("job_ingestion_runs")
      .select("finished_at")
      .eq("status", "success")
      .order("finished_at", { ascending: false })
      .limit(1),
    admin
      .from("job_ingestion_runs")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("started_at", last24Hours),
    admin
      .from("job_ingestion_dead_letters")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("saved_searches")
      .select("alert_frequency, created_at, last_alerted_at")
      .neq("alert_frequency", "off")
      .limit(1_000),
    admin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last24Hours),
  ]);

  const databaseLatencyMs = Math.round(performance.now() - databaseStartedAt);
  const databaseErrors = [
    jobsResult.error,
    ingestionResult.error,
    failedRunsResult.error,
    deadLettersResult.error,
    alertSearchesResult.error,
    applicationsResult.error,
  ].filter(Boolean);

  if (databaseErrors.length > 0) {
    return {
      status: "unavailable",
      checkedAt: nowIso,
      checks: [
        {
          name: "Database",
          status: "unavailable",
          summary: "One or more operational queries failed",
          value: databaseLatencyMs,
          target: `< ${OPERATIONS_THRESHOLDS.databaseLatencyMs} ms`,
        },
      ],
    };
  }

  const alertRows = (alertSearchesResult.data ?? []) as SavedSearchAlertRow[];
  const overdueAlerts = alertRows.filter((search) => {
    const referenceTime = Date.parse(
      search.last_alerted_at ?? search.created_at,
    );
    if (Number.isNaN(referenceTime)) return true;
    const dueHours =
      (search.last_alerted_at
        ? hoursForAlertFrequency(search.alert_frequency)
        : 0) + OPERATIONS_THRESHOLDS.alertBacklogHours;
    return now.getTime() - referenceTime > dueHours * 3_600_000;
  }).length;
  const openDeadLetters = deadLettersResult.count ?? 0;
  const failedRuns = failedRunsResult.count ?? 0;
  const configurationReady = [
    "CRON_SECRET",
    "INGEST_SECRET",
    "RESEND_API_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "UPSTASH_REDIS_REST_TOKEN",
    "UPSTASH_REDIS_REST_URL",
  ].every((name) => Boolean(process.env[name]));
  const ingestionFreshness = freshnessCheck({
    name: "Ingestion",
    latestAt: ingestionResult.data?.[0]?.finished_at ?? null,
    now,
    thresholdHours: OPERATIONS_THRESHOLDS.ingestionFreshnessHours,
    missingSummary: "No successful ingestion run was found",
  });

  const checks: OperationalCheck[] = [
    {
      name: "Database",
      status:
        databaseLatencyMs <= OPERATIONS_THRESHOLDS.databaseLatencyMs
          ? "healthy"
          : "degraded",
      summary: `${databaseLatencyMs} ms operational query latency`,
      value: databaseLatencyMs,
      target: `< ${OPERATIONS_THRESHOLDS.databaseLatencyMs} ms`,
    },
    freshnessCheck({
      name: "Job freshness",
      latestAt: jobsResult.data?.[0]?.posted_at ?? null,
      now,
      thresholdHours: OPERATIONS_THRESHOLDS.jobFreshnessHours,
      missingSummary: "No active published jobs were found",
    }),
    {
      ...ingestionFreshness,
      summary: `${ingestionFreshness.summary}; ${failedRuns} failed runs and ${openDeadLetters} open dead letters`,
      status:
        failedRuns > 0 || openDeadLetters > 0
          ? "degraded"
          : ingestionFreshness.status,
    },
    {
      name: "Job alerts",
      status: overdueAlerts === 0 ? "healthy" : "degraded",
      summary: `${overdueAlerts} overdue of ${alertRows.length} enabled searches checked`,
      value: overdueAlerts,
      target: "0 overdue alerts",
    },
    {
      name: "Applications",
      status: "healthy",
      summary: `${applicationsResult.count ?? 0} submitted in the last 24 hours`,
      value: applicationsResult.count ?? 0,
      target: "No sustained 5xx failures in logs",
    },
    {
      name: "Production configuration",
      status: configurationReady ? "healthy" : "degraded",
      summary: configurationReady
        ? "Critical integrations are configured"
        : "One or more critical integration variables are missing",
      target: "All critical integrations configured",
    },
  ];

  return {
    status: overallHealth(checks),
    checkedAt: nowIso,
    checks,
  };
}
