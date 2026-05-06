"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { JobCard } from "@/components/jobs/JobCard";
import { keywordSuggestions, locationSuggestions } from "@/data/suggestions";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/db/types";

const DEFAULT_POSTED = "30";
const DEFAULT_DISTANCE = "100";
const PAGE_SIZE = 10;

type JobCardJob = React.ComponentProps<typeof JobCard>["job"];

function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
) {
  if (!min && !max) return undefined;

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

function daysAgoLabel(postedAt: string | null | undefined) {
  if (!postedAt) return 0;

  const postedTime = new Date(postedAt).getTime();

  if (Number.isNaN(postedTime)) return 0;

  const days = Math.floor((Date.now() - postedTime) / 86_400_000);

  return Math.max(days, 0);
}

function toCardShape(job: Job): JobCardJob {
  return {
    id: job.id,
    slug: job.slug ?? job.id,

    company: job.company_name,
    logo: job.company_logo_url ?? job.company_name.slice(0, 2).toUpperCase(),

    title: job.title,
    location: job.location,
    postedDaysAgo: daysAgoLabel(job.posted_at),
    employmentType: job.employment_type,

    summary: job.description ? job.description.slice(0, 180) : "",
    description: job.description ?? "",

    salary: formatSalary(
      job.salary_min,
      job.salary_max,
      job.salary_currency ?? "USD",
    ),

    workMode: job.work_mode,
    distance: 0,

    skills: job.skills ?? [],
    applicants: job.applicant_count ?? 0,

    applyUrl: job.apply_url ?? undefined,

    companyTagline: job.company_tagline ?? "",
    companySize: job.company_size ?? "",
    companyWebsite: job.company_website ?? "",
    experienceLevel: job.experience_level ?? "",
    category: job.category ?? "",

    responsibilities: job.responsibilities ?? [],
    requirements: job.requirements ?? [],
    benefits: job.benefits ?? [],
  };
}

export default function JobsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [dateFilter, setDateFilter] = useState(
    searchParams.get("posted") ?? DEFAULT_POSTED,
  );
  const [distance, setDistance] = useState(
    searchParams.get("distance") ?? DEFAULT_DISTANCE,
  );
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1"));

  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  useEffect(() => {
    const next = new URLSearchParams();

    if (query) next.set("q", query);
    if (location) next.set("location", location);
    if (dateFilter !== DEFAULT_POSTED) next.set("posted", dateFilter);
    if (distance !== DEFAULT_DISTANCE) next.set("distance", distance);
    if (page > 1) next.set("page", String(page));

    const nextQuery = next.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }
  }, [
    query,
    location,
    dateFilter,
    distance,
    page,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    setPage(1);
  }, [query, location, dateFilter, distance]);

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      setLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
          daysAgo: dateFilter,
        });

        if (query.trim()) {
          params.set("query", query.trim());
        }

        if (location.trim()) {
          params.set("location", location.trim());
        }

        const response = await fetch(`/api/jobs?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Could not load jobs.");
        }

        const body = await response.json();

        const nextJobs: Job[] = Array.isArray(body)
          ? body
          : Array.isArray(body.data)
            ? body.data
            : [];

        if (!active) return;

        setJobs(nextJobs);
        setTotalJobs(Number(body.total ?? nextJobs.length));
        setTotalPages(Number(body.totalPages ?? 1));
      } catch (error) {
        if (!active) return;

        setJobs([]);
        setTotalJobs(0);
        setTotalPages(1);
        setLoadError(
          error instanceof Error ? error.message : "Could not load jobs.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      active = false;
    };
  }, [page, query, location, dateFilter]);

  const cardJobs = useMemo(() => jobs.map(toCardShape), [jobs]);

  const filteredJobs = useMemo(
    () =>
      cardJobs.filter((job) => {
        const distanceMatch = job.distance <= Number(distance);

        return distanceMatch;
      }),
    [cardJobs, distance],
  );

  const clearAll = () => {
    setQuery("");
    setLocation("");
    setDateFilter(DEFAULT_POSTED);
    setDistance(DEFAULT_DISTANCE);
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(query || location) ||
    dateFilter !== DEFAULT_POSTED ||
    distance !== DEFAULT_DISTANCE;

  const currentPage = Math.min(page, totalPages);

  const goToPage = (targetPage: number) => {
    const next = Math.min(Math.max(1, targetPage), totalPages);
    setPage(next);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const pageNumbers = useMemo(() => {
    const nums: (number | "ellipsis")[] = [];
    const windowSize = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        Math.abs(i - currentPage) <= windowSize
      ) {
        nums.push(i);
      } else if (nums[nums.length - 1] !== "ellipsis") {
        nums.push("ellipsis");
      }
    }

    return nums;
  }, [totalPages, currentPage]);

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-hero-gradient px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <Badge variant="soft">Search results</Badge>

          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Find the role that moves your career forward.
          </h1>

          <div className="mt-7 grid gap-2 rounded-xl border border-border/80 bg-surface/95 p-2 shadow-lift backdrop-blur md:grid-cols-[1fr_1fr_auto]">
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
              <Search className="size-4 text-muted-foreground" />

              <Input
                list="job-keyword-suggestions"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Job title, skill, company, or keyword"
                className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />

              <datalist id="job-keyword-suggestions">
                {keywordSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
              <MapPin className="size-4 text-muted-foreground" />

              <Input
                list="job-location-suggestions"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, state, or remote"
                className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />

              <datalist id="job-location-suggestions">
                {locationSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>

            <Button variant="hero" size="xl">
              Search jobs
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-xl border border-border/80 bg-surface p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="size-4" />
              Filters
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <X className="size-3" />
                Clear
              </button>
            )}
          </div>

          <label className="mt-5 block text-sm font-medium">
            Posted within
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="1">Last 24 hours</option>
              <option value="3">Last 3 days</option>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="3650">Any time</option>
            </select>
          </label>

          <label className="mt-5 block text-sm font-medium">
            Distance
            <select
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="5">Within 5 miles</option>
              <option value="10">Within 10 miles</option>
              <option value="25">Within 25 miles</option>
              <option value="50">Within 50 miles</option>
              <option value="100">Within 100 miles</option>
            </select>
          </label>

          <div className="mt-5 space-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-3.5" />
              {dateFilter === "3650" ? "Any time" : `${dateFilter} day window`}
            </p>

            <p className="flex items-center gap-2">
              <MapPin className="size-3.5" />
              {distance} mile radius
            </p>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  "Loading jobs..."
                ) : (
                  <>
                    {totalJobs} {totalJobs === 1 ? "job" : "jobs"} found
                    {totalJobs > 0 && (
                      <>
                        {" "}
                        · showing{" "}
                        <span className="font-medium text-foreground">
                          {(currentPage - 1) * PAGE_SIZE + 1}–
                          {Math.min(currentPage * PAGE_SIZE, totalJobs)}
                        </span>
                      </>
                    )}
                  </>
                )}
              </p>

              <h2 className="text-2xl font-bold tracking-tight">
                Recommended listings
              </h2>
            </div>

            <Button variant="glass" asChild>
              <Link href="/signin">Save search</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-xl border border-border bg-card p-10 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading jobs...
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-dashed border-destructive/40 bg-card p-10 text-center">
              <h3 className="text-lg font-semibold">Could not load jobs</h3>

              <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <h3 className="text-lg font-semibold">
                No matches in your filters
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Try widening the date range or distance, or clear filters.
              </p>

              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearAll}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    saved={isSaved(job.id)}
                    saving={pendingId === job.id}
                    onSave={toggleSaved}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination className="pt-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(currentPage - 1);
                        }}
                        className={cn(
                          currentPage === 1 && "pointer-events-none opacity-50",
                        )}
                      />
                    </PaginationItem>

                    {pageNumbers.map((pageNumber, index) => (
                      <PaginationItem key={`${pageNumber}-${index}`}>
                        {pageNumber === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === currentPage}
                            onClick={(event) => {
                              event.preventDefault();
                              goToPage(pageNumber);
                            }}
                          >
                            {pageNumber}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(currentPage + 1);
                        }}
                        className={cn(
                          currentPage === totalPages &&
                            "pointer-events-none opacity-50",
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
