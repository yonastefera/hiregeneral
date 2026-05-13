"use client";

import { Component } from "react";
import type { ComponentType, ErrorInfo, ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { JobSeekerDashboardJob } from "./job-seeker-dashboard-data";

export interface JobSeekerStatCardData {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  ariaLabel: string;
}

export interface JobSeekerWorkspaceCardData {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  href: string;
}

export interface JobSeekerChecklistData {
  title: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  items: string[];
  ariaLabel: string;
}

interface JobSeekerDashboardErrorBoundaryState {
  hasError: boolean;
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
): string | null {
  if (min == null && max == null) return null;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (min != null && max != null) {
    return `${formatter.format(min)} – ${formatter.format(max)}`;
  }

  if (min != null) {
    return `From ${formatter.format(min)}`;
  }

  return `Up to ${formatter.format(max!)}`;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string | null | undefined): string {
  const date = toDate(value);

  if (!date) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function toDateTime(value: string | null | undefined): string | undefined {
  return toDate(value)?.toISOString();
}

export class JobSeekerDashboardErrorBoundary extends Component<
  { children: ReactNode },
  JobSeekerDashboardErrorBoundaryState
> {
  state: JobSeekerDashboardErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): JobSeekerDashboardErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Job seeker dashboard render error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          id="main-content"
          className="min-h-screen bg-background px-4 py-8"
          role="main"
        >
          <section
            role="alert"
            aria-labelledby="dashboard-error-title"
            className="mx-auto max-w-3xl rounded-lg border border-dashed border-destructive/40 bg-surface p-6 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 size-5 shrink-0 text-destructive"
                aria-hidden="true"
              />

              <div>
                <h1
                  id="dashboard-error-title"
                  className="text-xl font-bold tracking-tight"
                >
                  Dashboard unavailable
                </h1>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Something went wrong while rendering your dashboard. Refresh
                  the page or try again shortly.
                </p>
              </div>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export function JobSeekerStatCard({ data }: { data: JobSeekerStatCardData }) {
  const Icon = data.icon;

  return (
    <article
      aria-label={data.ariaLabel}
      className="rounded-lg border border-border bg-surface p-5 shadow-soft"
    >
      <Icon className="size-5 text-primary" aria-hidden={true} />

      <p className="mt-4 text-3xl font-bold">{data.value.toLocaleString()}</p>

      <p className="text-sm text-muted-foreground">{data.label}</p>
    </article>
  );
}

export function JobSeekerWorkspaceCard({
  card,
}: {
  card: JobSeekerWorkspaceCardData;
}) {
  const Icon = card.icon;

  return (
    <article className="rounded-lg border border-border bg-surface p-6 shadow-soft">
      <Icon className="size-7 text-primary" aria-hidden={true} />

      <h3 className="mt-5 text-xl font-bold tracking-tight">{card.title}</h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {card.description}
      </p>

      <Button variant="glass" className="mt-5 min-h-11" asChild>
        <Link href={card.href} prefetch>
          Open
          <span className="sr-only"> {card.title}</span>
        </Link>
      </Button>
    </article>
  );
}

export function FeaturedJobsPanel({
  jobs,
  error,
}: {
  jobs: JobSeekerDashboardJob[];
  error: string | null;
}) {
  return (
    <section
      aria-labelledby="featured-jobs-heading"
      className="rounded-lg border border-border bg-surface p-6 shadow-soft"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness
            className="size-5 text-primary"
            aria-hidden="true"
          />

          <h2
            id="featured-jobs-heading"
            className="text-xl font-bold tracking-tight"
          >
            Featured jobs
          </h2>
        </div>

        <Button variant="outline" size="sm" className="min-h-11" asChild>
          <Link href="/jobs" prefetch>
            Browse all jobs
          </Link>
        </Button>
      </div>

      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-6 flex items-start gap-3 rounded-lg border border-dashed border-destructive/40 bg-background p-5"
        >
          <AlertCircle
            className="mt-0.5 size-5 shrink-0 text-destructive"
            aria-hidden="true"
          />

          <div>
            <strong className="text-sm text-foreground">
              Could not load featured jobs
            </strong>

            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
          No featured jobs are available yet.{" "}
          <Link href="/jobs" className="underline underline-offset-2">
            Browse all jobs
          </Link>
          .
        </div>
      ) : (
        <div className="mt-5 divide-y divide-border/70" role="list">
          {jobs.map((job) => {
            const salary = formatSalary(
              job.salary_min,
              job.salary_max,
              job.salary_currency,
            );

            const jobHref = `/jobs/${job.slug ?? job.id}`;

            return (
              <article
                key={job.id}
                className="py-4 first:pt-0 last:pb-0"
                role="listitem"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      {job.company_name}
                    </p>

                    <Link
                      href={jobHref}
                      className="mt-1 block rounded px-1 font-semibold tracking-tight hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      prefetch
                    >
                      {job.title}
                    </Link>

                    <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <dt className="sr-only">Location</dt>
                        <MapPin className="size-3.5" aria-hidden="true" />
                        <dd>{job.location}</dd>
                      </div>

                      <div>
                        <dt className="sr-only">Employment type</dt>
                        <dd>{job.employment_type}</dd>
                      </div>

                      <div>
                        <dt className="sr-only">Work mode</dt>
                        <dd>{job.work_mode}</dd>
                      </div>

                      <div>
                        <dt className="sr-only">Posted</dt>
                        <dd>
                          <time dateTime={toDateTime(job.posted_at)}>
                            {formatDate(job.posted_at)}
                          </time>
                        </dd>
                      </div>
                    </dl>

                    {salary ? (
                      <p className="mt-2 text-xs font-medium text-foreground">
                        Salary range: {salary}
                      </p>
                    ) : null}
                  </div>

                  {job.apply_url ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11 shrink-0"
                      asChild
                    >
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open external application link for ${job.title}`}
                        title={`Apply for ${job.title} opens in a new tab`}
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11 shrink-0"
                      asChild
                    >
                      <Link
                        href={jobHref}
                        aria-label={`View details for ${job.title}`}
                        prefetch
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function JobSearchChecklistPanel({
  panel,
}: {
  panel: JobSeekerChecklistData;
}) {
  const Icon = panel.icon;

  return (
    <section
      aria-labelledby="job-search-checklist-heading"
      className="h-fit rounded-lg border border-border bg-surface p-6 shadow-soft lg:sticky lg:top-8"
    >
      <div className="flex items-center gap-2">
        <Icon className="size-5 text-primary" aria-hidden={true} />

        <h2
          id="job-search-checklist-heading"
          className="text-xl font-bold tracking-tight"
        >
          {panel.title}
        </h2>
      </div>

      <ul className="mt-5 space-y-4" aria-label={panel.ariaLabel}>
        {panel.items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CheckCircle2
              className="size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
