"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  Calendar,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { listingTitle } from "@/lib/jobs/display";
import { companyInitials, isSupportedLogoUrl } from "@/lib/logos";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;
const INACTIVE_DAYS = 60;

const prettyDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const applicationStatuses = [
  "submitted",
  "reviewed",
  "reviewing",
  "interview",
  "offer",
  "closed",
  "rejected",
  "withdrawn",
] as const;

type ApplicationStatus = (typeof applicationStatuses)[number];

type SavedJobRecord = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary?: string;
  savedAt: string;
  active: boolean;
  slug: string;
};

type ApplicationRecord = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  resumeName: string;
  resumeUrl: string | null;
  appliedAt: string;
  receivedAt: string;
  status: ApplicationStatus;
  slug: string;
};

type ApiJob = {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  status?: string | null;
  slug: string | null;
};

type SavedApiRow = {
  id: string;
  created_at: string;
  jobs: ApiJob | null;
};

type ApplicationApiRow = {
  id: string;
  status: string;
  created_at: string;
  resume_url: string | null;
  jobs: ApiJob | null;
};

const isWithin = (iso: string, days: number) => {
  const timestamp = new Date(iso).getTime();

  if (Number.isNaN(timestamp)) return false;

  const diff = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

  return diff >= 0 && diff <= days;
};

function formatPrettyDate(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return "Unknown date";

  return prettyDateFormatter.format(new Date(timestamp));
}

function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency = "USD",
) {
  const hasMin = min != null;
  const hasMax = max != null;

  if (!hasMin && !hasMax) return undefined;

  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  if (hasMin && hasMax) return `${fmt(min)} - ${fmt(max)}`;
  if (hasMin) return `From ${fmt(min)}`;

  return `Up to ${fmt(max!)}`;
}

function normalizeApplicationStatus(status: string): ApplicationStatus {
  return applicationStatuses.includes(status as ApplicationStatus)
    ? (status as ApplicationStatus)
    : "submitted";
}

function logoFor(job: ApiJob) {
  return job.company_logo_url ?? companyInitials(job.company_name);
}

function resumeName(path: string | null) {
  if (!path) return "Submitted resume";

  return path.split("/").pop() ?? "Submitted resume";
}

function toSavedRecord(row: SavedApiRow): SavedJobRecord | null {
  if (!row.jobs) return null;

  return {
    id: row.id,
    jobId: row.jobs.id,
    slug: row.jobs.slug ?? row.jobs.id,
    title: listingTitle(row.jobs.title),
    company: row.jobs.company_name,
    logo: logoFor(row.jobs),
    location: row.jobs.location,
    salary: formatSalary(
      row.jobs.salary_min,
      row.jobs.salary_max,
      row.jobs.salary_currency ?? "USD",
    ),
    savedAt: row.created_at,
    active: row.jobs.status !== "closed",
  };
}

function toApplicationRecord(row: ApplicationApiRow): ApplicationRecord | null {
  if (!row.jobs) return null;

  return {
    id: row.id,
    jobId: row.jobs.id,
    slug: row.jobs.slug ?? row.jobs.id,
    title: listingTitle(row.jobs.title),
    company: row.jobs.company_name,
    logo: logoFor(row.jobs),
    location: row.jobs.location,
    resumeName: resumeName(row.resume_url),
    resumeUrl: row.resume_url,
    appliedAt: row.created_at,
    receivedAt: row.created_at,
    status: normalizeApplicationStatus(row.status),
  };
}

function CompanyAvatar({ company, logo }: { company: string; logo: string }) {
  const logoUrl = isSupportedLogoUrl(logo) ? logo : null;
  const logoText = logoUrl
    ? null
    : logo.startsWith("http")
      ? companyInitials(company)
      : logo;

  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-transparent text-sm font-semibold text-secondary-foreground">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={48}
          height={48}
          className="size-full object-contain p-1.5"
        />
      ) : (
        <span aria-hidden="true">{logoText}</span>
      )}
    </div>
  );
}

function SavedCard({
  item,
  onUnsave,
  unsaving,
}: {
  item: SavedJobRecord;
  onUnsave: (jobId: string) => void;
  unsaving: boolean;
}) {
  return (
    <article className="group rounded-xl border border-border/80 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-soft focus-within:border-primary/40 focus-within:shadow-soft">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <CompanyAvatar company={item.company} logo={item.logo} />

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {item.company}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label={`Remove ${item.title} from saved jobs`}
            disabled={unsaving}
            onClick={() => onUnsave(item.jobId)}
            className={cn(
              "grid h-10 w-[31px] shrink-0 place-items-center rounded-lg border-none bg-transparent text-primary transition-colors hover:bg-transparent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait disabled:opacity-80",
            )}
          >
            {unsaving ? (
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            ) : (
              <Bookmark className="size-6 fill-current" aria-hidden="true" />
            )}
          </button>
        </div>

        <h2 className="mt-4 truncate text-base font-semibold tracking-tight md:text-lg">
          <Link
            href={`/jobs/${item.slug}`}
            className="text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {item.title}
          </Link>
        </h2>

        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden="true" />
            {item.location}
          </span>

          {item.salary && (
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="size-3.5" aria-hidden="true" />
              {item.salary}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" aria-hidden="true" />
            Saved {formatPrettyDate(item.savedAt)}
          </span>
        </div>

        <Link
          href={`/jobs/${item.slug}`}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-all hover:text-primary group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={`View details for ${item.title}`}
        >
          View details <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

const statusColor: Record<
  ApplicationRecord["status"],
  "secondary" | "warm" | "success" | "soft"
> = {
  submitted: "soft",
  reviewed: "secondary",
  reviewing: "secondary",
  interview: "warm",
  offer: "success",
  closed: "soft",
  rejected: "soft",
  withdrawn: "soft",
};

function ApplicationCard({ item }: { item: ApplicationRecord }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-soft focus-within:border-primary/40 focus-within:shadow-soft">
      <div className="flex items-start gap-4">
        <CompanyAvatar company={item.company} logo={item.logo} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.company}
              </p>

              <h2 className="mt-1 truncate text-base font-semibold tracking-tight md:text-lg">
                <Link
                  href={`/jobs/${item.slug}`}
                  className="text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {item.title}
                </Link>
              </h2>
            </div>

            <Badge variant={statusColor[item.status]} className="capitalize">
              {item.status}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden="true" />
              {item.location}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" aria-hidden="true" />
              Applied {formatPrettyDate(item.appliedAt)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" aria-hidden="true" />
              Received {formatPrettyDate(item.receivedAt)}
            </span>
          </div>

          {item.resumeUrl ? (
            <a
              href={item.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <FileText className="size-3.5" aria-hidden="true" />
              <span className="max-w-[18rem] truncate">{item.resumeName}</span>
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ) : (
            <span className="mt-3 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <FileText className="size-3.5" aria-hidden="true" />
              <span className="max-w-[18rem] truncate">{item.resumeName}</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function SavedJobsPage() {
  const router = useRouter();

  const [savedVisible, setSavedVisible] = useState(PAGE_SIZE);
  const [appsVisible, setAppsVisible] = useState(PAGE_SIZE);
  const [savedRows, setSavedRows] = useState<SavedApiRow[]>([]);
  const [applicationRows, setApplicationRows] = useState<ApplicationApiRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { toggleSaved, pendingId } = useSavedJobs();

  useEffect(() => {
    const controller = new AbortController();

    async function loadActivity() {
      setLoading(true);
      setLoadError(null);

      try {
        const [savedResponse, applicationsResponse] = await Promise.all([
          fetch("/api/saved", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/applications", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (
          savedResponse.status === 401 ||
          applicationsResponse.status === 401
        ) {
          router.replace("/signin?next=/saved");
          return;
        }

        if (!savedResponse.ok) {
          throw new Error("Could not load saved jobs.");
        }

        if (!applicationsResponse.ok) {
          throw new Error("Could not load applications.");
        }

        const [savedBody, applicationsBody] = await Promise.all([
          savedResponse.json(),
          applicationsResponse.json(),
        ]);

        if (controller.signal.aborted) return;

        setSavedRows(Array.isArray(savedBody.data) ? savedBody.data : []);
        setApplicationRows(
          Array.isArray(applicationsBody.data) ? applicationsBody.data : [],
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        setLoadError(
          error instanceof Error ? error.message : "Could not load activity.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadActivity();

    return () => {
      controller.abort();
    };
  }, [router]);

  const savedFiltered = useMemo(
    () =>
      savedRows
        .map(toSavedRecord)
        .filter((item): item is SavedJobRecord => Boolean(item))
        .filter(
          (savedJob) =>
            savedJob.active && isWithin(savedJob.savedAt, INACTIVE_DAYS),
        ),
    [savedRows],
  );

  const appsFiltered = useMemo(
    () =>
      applicationRows
        .map(toApplicationRecord)
        .filter((item): item is ApplicationRecord => Boolean(item))
        .filter((application) =>
          isWithin(application.appliedAt, INACTIVE_DAYS),
        ),
    [applicationRows],
  );

  const onUnsave = async (jobId: string) => {
    const saved = await toggleSaved(jobId);

    if (!saved) {
      setSavedRows((rows) => rows.filter((row) => row.jobs?.id !== jobId));
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6">
          <Badge variant="soft">Your activity</Badge>

          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Saved & applied
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Listings inactive for more than {INACTIVE_DAYS} days are hidden
            automatically.
          </p>
        </div>

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center rounded-lg border border-border bg-card p-12 text-muted-foreground"
          >
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden="true" />
            Loading your activity...
          </div>
        ) : loadError ? (
          <EmptyState
            title="Could not load your activity"
            description={loadError}
            action={
              <Button onClick={() => window.location.reload()}>
                Try again
              </Button>
            }
          />
        ) : (
          <Tabs defaultValue="saved" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:w-80">
              <TabsTrigger value="saved">
                Saved jobs ({savedFiltered.length})
              </TabsTrigger>

              <TabsTrigger value="applications">
                Applications ({appsFiltered.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saved" className="mt-6">
              {savedFiltered.length === 0 ? (
                <EmptyState
                  title="No saved jobs yet"
                  description="Tap the bookmark on any job to save it for later."
                  action={
                    <Button asChild>
                      <Link href="/jobs">Browse jobs</Link>
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="grid gap-3">
                    {savedFiltered.slice(0, savedVisible).map((item) => (
                      <SavedCard
                        key={item.id}
                        item={item}
                        onUnsave={onUnsave}
                        unsaving={pendingId === item.jobId}
                      />
                    ))}
                  </div>

                  {savedVisible < savedFiltered.length && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setSavedVisible((count) => count + PAGE_SIZE)
                        }
                      >
                        Load more ({savedFiltered.length - savedVisible}{" "}
                        remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="applications" className="mt-6">
              {appsFiltered.length === 0 ? (
                <EmptyState
                  title="No applications sent"
                  description="When you apply to a role, it will show up here with the resume you submitted."
                  action={
                    <Button asChild>
                      <Link href="/jobs">Find roles</Link>
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="grid gap-3">
                    {appsFiltered.slice(0, appsVisible).map((item) => (
                      <ApplicationCard key={item.id} item={item} />
                    ))}
                  </div>

                  {appsVisible < appsFiltered.length && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setAppsVisible((count) => count + PAGE_SIZE)
                        }
                      >
                        Load more ({appsFiltered.length - appsVisible}{" "}
                        remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </section>
    </main>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>

      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <div className="mt-5">{action}</div>
    </div>
  );
}
