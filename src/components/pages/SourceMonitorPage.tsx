"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type MonitorStatus =
  | "running"
  | "success"
  | "failed"
  | "missing"
  | "stale_running";

type MonitorRun = {
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

type MonitorSource = {
  companyName: string;
  sourceType: string;
  sourceSlug: string;
  healthy: boolean;
  status: MonitorStatus;
  runCount: number;
  successCount: number;
  failedCount: number;
  runningCount: number;
  staleRunningCount?: number;
  latestRun: MonitorRun | null;
  lastError: string | null;
};

type MonitorCompany = {
  companyName: string;
  publishedJobs: number;
  newJobsInWindow: number;
  newJobs24h: number;
  newJobs7d: number;
  expiredJobs: number;
  latestPostedAt: string | null;
};

type MonitorResponse = {
  ok: boolean;
  error?: string;
  window?: {
    label: string;
    timezone: string;
    start: string;
    end: string;
  };
  totals?: {
    enabledSources: number;
    sourcesWithRuns: number;
    unhealthySources: number;
    runs: number;
    fetchedJobs: number;
    validJobs: number;
    rejectedJobs: number;
    upsertedJobs: number;
    expiredJobs: number;
    successfulRuns: number;
    failedRuns: number;
    runningRuns: number;
    staleRunningRuns?: number;
    activeImportedJobs: number;
    expiredImportedJobs: number;
    companiesWithPublishedJobs: number;
  };
  sources?: MonitorSource[];
  companies?: MonitorCompany[];
  topNewCompanies?: MonitorCompany[];
  failures?: Array<{
    companyName: string;
    sourceType: string;
    sourceSlug: string;
    status: MonitorStatus;
    error: string | null;
  }>;
};

const STORAGE_KEY = "hiregeneral.ingestMonitorSecret";

const windowOptions = [
  { value: "24h", label: "Last 24 hours" },
  { value: "yesterday", label: "Yesterday" },
];

function formatNumber(value: number | null | undefined) {
  return (value ?? 0).toLocaleString();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: MonitorStatus) {
  return status.replace("_", " ");
}

function statusVariant(status: MonitorStatus) {
  if (status === "success") return "success";
  if (status === "failed" || status === "stale_running") return "destructive";
  if (status === "running") return "warm";
  return "soft";
}

function qualityNotes(source: MonitorSource, company?: MonitorCompany) {
  const notes: string[] = [];
  const latestRun = source.latestRun;

  if (source.status === "missing") notes.push("No run in window");
  if (source.status === "stale_running") notes.push("Stale running job");
  if (source.failedCount > 0) notes.push(`${source.failedCount} failed`);
  if (latestRun && latestRun.valid_jobs === 0) notes.push("No valid jobs");
  if (latestRun && latestRun.expired_jobs > latestRun.upserted_jobs) {
    notes.push("High expiry");
  }
  if (company && company.publishedJobs === 0) notes.push("No active jobs");

  return notes.length > 0 ? notes.join(", ") : "Looks clean";
}

export default function SourceMonitorPage() {
  const [secret, setSecret] = useState("");
  const [savedSecretLoaded, setSavedSecretLoaded] = useState(false);
  const [windowValue, setWindowValue] = useState("24h");
  const [monitor, setMonitor] = useState<MonitorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setSecret(saved);
    }

    setSavedSecretLoaded(true);
  }, []);

  const companiesByName = useMemo(() => {
    const map = new Map<string, MonitorCompany>();

    for (const company of monitor?.companies ?? []) {
      map.set(company.companyName, company);
    }

    return map;
  }, [monitor?.companies]);

  const sortedSources = useMemo(() => {
    return [...(monitor?.sources ?? [])].sort((a, b) => {
      if (a.healthy !== b.healthy) return a.healthy ? 1 : -1;

      const aJobs = companiesByName.get(a.companyName)?.publishedJobs ?? 0;
      const bJobs = companiesByName.get(b.companyName)?.publishedJobs ?? 0;

      return bJobs - aJobs || a.companyName.localeCompare(b.companyName);
    });
  }, [companiesByName, monitor?.sources]);

  const loadMonitor = async () => {
    if (!secret.trim()) {
      setError("Enter the ingest secret to load source monitoring.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      window.localStorage.setItem(STORAGE_KEY, secret.trim());

      const params = new URLSearchParams();

      if (windowValue === "24h") {
        params.set("window", "24h");
      }

      const response = await fetch(
        `/api/ingest/jobs/monitor?${params.toString()}`,
        {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${secret.trim()}`,
          },
        },
      );

      const body = (await response
        .json()
        .catch(() => null)) as MonitorResponse | null;

      if (!response.ok || !body) {
        throw new Error(body?.error ?? "Could not load source monitor.");
      }

      setMonitor(body);
    } catch (loadError) {
      setMonitor(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load source monitor.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!savedSecretLoaded || !secret) return;

    loadMonitor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSecretLoaded, windowValue]);

  const totals = monitor?.totals;

  const statCards = [
    {
      label: "Active imported jobs",
      value: totals?.activeImportedJobs,
      icon: Database,
    },
    {
      label: "Enabled sources",
      value: totals?.enabledSources,
      icon: CheckCircle2,
    },
    {
      label: "Failed runs",
      value: totals?.failedRuns,
      icon: ShieldAlert,
    },
    {
      label: "New jobs",
      value: monitor?.topNewCompanies?.reduce(
        (sum, company) => sum + company.newJobsInWindow,
        0,
      ),
      icon: TrendingUp,
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="soft">Source quality</Badge>

            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Imported job source monitor
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Watch ingestion health, active jobs, failed runs, stale sources,
              and companies that need review before the marketplace grows.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/admin-control-center">Back to admin</Link>
          </Button>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-surface p-4 shadow-soft">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <Input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadMonitor();
                }
              }}
              placeholder="INGEST_SECRET"
            />

            <select
              value={windowValue}
              onChange={(event) => setWindowValue(event.target.value)}
              className="h-11 rounded-xl border border-input bg-background/80 px-4 text-sm"
            >
              {windowOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button onClick={loadMonitor} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="size-4" />
            <AlertTitle>Could not load monitor</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {monitor && (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {statCards.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-surface p-5 shadow-soft"
                >
                  <stat.icon className="size-5 text-primary" />

                  <p className="mt-4 text-3xl font-bold">
                    {formatNumber(stat.value)}
                  </p>

                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
              <section className="rounded-xl border border-border bg-surface p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      Run summary
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {monitor.window
                        ? `${formatDateTime(monitor.window.start)} to ${formatDateTime(
                            monitor.window.end,
                          )} ${monitor.window.timezone}`
                        : "Current ingestion window"}
                    </p>
                  </div>

                  <Badge
                    variant={monitor.ok ? "success" : "destructive"}
                    className="capitalize"
                  >
                    {monitor.ok ? "Healthy" : "Needs review"}
                  </Badge>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <SummaryMetric label="Runs" value={totals?.runs} />
                  <SummaryMetric label="Fetched" value={totals?.fetchedJobs} />
                  <SummaryMetric
                    label="Upserted"
                    value={totals?.upsertedJobs}
                  />
                  <SummaryMetric label="Expired" value={totals?.expiredJobs} />
                  <SummaryMetric
                    label="Companies"
                    value={totals?.companiesWithPublishedJobs}
                  />
                  <SummaryMetric
                    label="Unhealthy"
                    value={totals?.unhealthySources}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-border bg-surface p-6 shadow-soft">
                <h2 className="text-xl font-bold tracking-tight">
                  Top new companies
                </h2>

                <div className="mt-4 space-y-3">
                  {(monitor.topNewCompanies ?? []).length > 0 ? (
                    monitor.topNewCompanies?.slice(0, 6).map((company) => (
                      <div
                        key={company.companyName}
                        className="flex items-center justify-between gap-4 rounded-lg bg-background p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {company.companyName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(company.publishedJobs)} active jobs
                          </p>
                        </div>

                        <Badge variant="success">
                          +{formatNumber(company.newJobsInWindow)}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No new jobs in this window.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {(monitor.failures ?? []).length > 0 && (
              <Alert variant="destructive" className="mt-6">
                <ShieldAlert className="size-4" />
                <AlertTitle>Sources need attention</AlertTitle>
                <AlertDescription>
                  {monitor.failures
                    ?.map(
                      (failure) =>
                        `${failure.companyName}: ${
                          failure.error ?? statusLabel(failure.status)
                        }`,
                    )
                    .join(" · ")}
                </AlertDescription>
              </Alert>
            )}

            <section className="mt-8 rounded-xl border border-border bg-surface shadow-soft">
              <div className="flex flex-col gap-2 border-b border-border p-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Source health
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Sorted by sources that need attention first, then active job
                    count.
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {formatNumber(sortedSources.length)} sources
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                    <TableHead className="text-right">New 24h</TableHead>
                    <TableHead className="text-right">Expired</TableHead>
                    <TableHead>Latest run</TableHead>
                    <TableHead>Quality</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sortedSources.map((source) => {
                    const company = companiesByName.get(source.companyName);

                    return (
                      <TableRow
                        key={`${source.sourceType}:${source.sourceSlug}`}
                      >
                        <TableCell>
                          <div className="min-w-48">
                            <p className="font-medium">{source.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {source.sourceSlug}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={statusVariant(source.status)}
                            className="capitalize"
                          >
                            {statusLabel(source.status)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant="soft">{source.sourceType}</Badge>
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {formatNumber(company?.publishedJobs)}
                        </TableCell>

                        <TableCell className="text-right">
                          {formatNumber(company?.newJobs24h)}
                        </TableCell>

                        <TableCell className="text-right">
                          {formatNumber(company?.expiredJobs)}
                        </TableCell>

                        <TableCell>
                          <div className="min-w-36 text-sm">
                            <p>
                              {formatDateTime(source.latestRun?.started_at)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {source.latestRun
                                ? `${formatNumber(
                                    source.latestRun.valid_jobs,
                                  )} valid / ${formatNumber(
                                    source.latestRun.expired_jobs,
                                  )} expired`
                                : "No run in window"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 text-sm",
                              source.healthy
                                ? "text-muted-foreground"
                                : "text-destructive",
                            )}
                          >
                            {source.healthy ? (
                              <CheckCircle2 className="size-4" />
                            ) : (
                              <Clock3 className="size-4" />
                            )}
                            {qualityNotes(source, company)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background p-4">
      <p className="text-2xl font-bold">{formatNumber(value)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
