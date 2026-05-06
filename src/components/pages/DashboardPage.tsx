"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Job } from "@/lib/db/types";

interface Stats {
  totalJobs: number;
  totalUsers: number;
  totalApplications: number;
  totalCompanies: number;
}

type DashboardJob = Job & {
  applicant_count?: number;
};

function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
) {
  if (!min && !max) return null;

  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;

  return `Up to ${fmt(max!)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function DashboardPage() {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin-control-center";

  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<DashboardJob[]>([]);

  const [statsLoading, setStatsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setStatsLoading(true);

      try {
        const response = await fetch("/api/stats", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load stats.");
        }

        const data = await response.json();

        if (!active) return;

        setStats(data);
      } catch {
        if (!active) return;

        setStats({
          totalJobs: 0,
          totalUsers: 0,
          totalApplications: 0,
          totalCompanies: 0,
        });
      } finally {
        if (active) {
          setStatsLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFeaturedJobs() {
      setJobsLoading(true);
      setJobsError(null);

      try {
        const params = new URLSearchParams({
          page: "1",
          pageSize: "3",
          daysAgo: "3650",
        });

        const response = await fetch(`/api/jobs?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Could not load featured jobs.");
        }

        const body = await response.json();

        const nextJobs: DashboardJob[] = Array.isArray(body.data)
          ? body.data
          : [];

        if (!active) return;

        setJobs(nextJobs.slice(0, 3));
      } catch (error) {
        if (!active) return;

        setJobs([]);
        setJobsError(
          error instanceof Error
            ? error.message
            : "Could not load featured jobs.",
        );
      } finally {
        if (active) {
          setJobsLoading(false);
        }
      }
    }

    loadFeaturedJobs();

    return () => {
      active = false;
    };
  }, []);

  const statCards = [
    {
      label: "Active listings",
      value: stats?.totalJobs ?? 0,
      icon: BriefcaseBusiness,
    },
    {
      label: "Registered users",
      value: stats?.totalUsers ?? 0,
      icon: UsersRound,
    },
    {
      label: "Applications",
      value: stats?.totalApplications ?? 0,
      icon: BarChart3,
    },
    {
      label: "Companies",
      value: stats?.totalCompanies ?? 0,
      icon: Building2,
    },
  ];

  const workspaceCards = isAdminRoute
    ? [
        {
          title: "Marketplace quality",
          description:
            "Review listings, monitor imported sources, and keep marketplace data clean.",
          icon: ShieldCheck,
          href: "/admin-control-center",
        },
        {
          title: "User management",
          description:
            "Manage job seekers, recruiters, companies, and role access.",
          icon: UsersRound,
          href: "/admin-control-center/users",
        },
        {
          title: "Listing moderation",
          description:
            "Audit published, expired, imported, and employer-submitted jobs.",
          icon: BriefcaseBusiness,
          href: "/admin-control-center/jobs",
        },
      ]
    : [
        {
          title: "Post a new job",
          description:
            "Create a listing with role details, requirements, salary, and application settings.",
          icon: Plus,
          href: "/post-job",
        },
        {
          title: "Manage listings",
          description:
            "Review published jobs, update roles, and track listing health.",
          icon: BriefcaseBusiness,
          href: "/employer/jobs",
        },
        {
          title: "Review applicants",
          description:
            "See new applications, candidate profiles, resumes, and application status.",
          icon: UsersRound,
          href: "/employer/applicants",
        },
      ];

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <Badge variant="soft">
          {isAdminRoute ? "Admin command center" : "Employer command center"}
        </Badge>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-balance text-4xl font-bold tracking-tight">
              {isAdminRoute
                ? "Manage marketplace quality across job seekers, recruiters, and admins."
                : "Manage job postings, applicants, and employer hiring activity."}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Track marketplace activity, highlight featured roles, and route
              users to the right workspace.
            </p>
          </div>

          <Button asChild>
            <Link
              href={isAdminRoute ? "/admin-control-center/jobs" : "/post-job"}
            >
              <Plus className="size-4" />
              {isAdminRoute ? "Review jobs" : "Post a job"}
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-surface p-5 shadow-soft"
            >
              {statsLoading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <stat.icon className="size-5 text-primary" />
              )}

              <p className="mt-4 text-3xl font-bold">
                {statsLoading ? "—" : stat.value.toLocaleString()}
              </p>

              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Workspace cards */}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {workspaceCards.map((card) => (
            <article
              key={card.title}
              className="rounded-lg border border-border bg-surface p-6 shadow-soft"
            >
              <card.icon className="size-7 text-primary" />

              <h2 className="mt-5 text-xl font-bold tracking-tight">
                {card.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {card.description}
              </p>

              <Button variant="glass" className="mt-5" asChild>
                <Link href={card.href}>Open workspace</Link>
              </Button>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          {/* Featured jobs */}
          <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="size-5 text-primary" />

                <h2 className="text-xl font-bold tracking-tight">
                  Featured jobs
                </h2>
              </div>

              <Button variant="outline" size="sm" asChild>
                <Link href="/jobs">Browse all jobs</Link>
              </Button>
            </div>

            {jobsLoading ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading featured jobs...
              </div>
            ) : jobsError ? (
              <div className="mt-6 rounded-lg border border-dashed border-destructive/40 bg-background p-5 text-sm text-muted-foreground">
                {jobsError}
              </div>
            ) : jobs.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
                No featured jobs available yet.
              </div>
            ) : (
              <div className="mt-5 divide-y divide-border/70">
                {jobs.map((job) => {
                  const salary = formatSalary(
                    job.salary_min,
                    job.salary_max,
                    job.salary_currency,
                  );

                  return (
                    <article key={job.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                            {job.company_name}
                          </p>

                          <Link
                            href={`/jobs/${job.slug ?? job.id}`}
                            className="mt-1 block font-semibold tracking-tight hover:text-primary"
                          >
                            {job.title}
                          </Link>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3.5" />
                              {job.location}
                            </span>

                            <span>{job.employment_type}</span>
                            <span>{job.work_mode}</span>
                            <span>{formatDate(job.posted_at)}</span>
                          </div>

                          {salary && (
                            <p className="mt-2 text-xs font-medium text-foreground">
                              {salary}
                            </p>
                          )}
                        </div>

                        {job.apply_url ? (
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={job.apply_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open external apply URL"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/jobs/${job.slug ?? job.id}`}
                              aria-label="View job details"
                            >
                              <ExternalLink className="size-4" />
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

          {/* Posting checklist / admin controls */}
          <section className="rounded-lg border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-2">
              {isAdminRoute ? (
                <ShieldCheck className="size-5 text-primary" />
              ) : (
                <CheckCircle2 className="size-5 text-primary" />
              )}

              <h2 className="text-xl font-bold tracking-tight">
                {isAdminRoute ? "Admin controls" : "Recruiter posting flow"}
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              {(isAdminRoute
                ? [
                    "Marketplace quality review",
                    "User and role management",
                    "Listing moderation",
                    "Imported job source monitoring",
                  ]
                : [
                    "Company profile and logo",
                    "Job title, location, work mode, salary range",
                    "Required skills and job description",
                    "Publish status and applicant review queue",
                  ]
              ).map((item) => (
                <p
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="size-4 text-success" />
                  {item}
                </p>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
