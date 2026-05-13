"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
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
import { JobCardSkeleton } from "@/components/jobs/JobLoadingSkeletons";
import { keywordSuggestions, locationSuggestions } from "@/data/suggestions";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { toJobCardShape } from "@/lib/jobs/card-shape";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/db/types";

const DEFAULT_POSTED = "3650";
const DEFAULT_DISTANCE = "100";
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type JobsApiResponse = {
  data?: Job[];
  total?: number;
  newJobs?: number;
  totalPages?: number;
  error?: string;
};

const postedOptions = [
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: DEFAULT_POSTED, label: "Any time" },
] as const;

const distanceOptions = [
  { value: "5", label: "Within 5 miles" },
  { value: "10", label: "Within 10 miles" },
  { value: "25", label: "Within 25 miles" },
  { value: "50", label: "Within 50 miles" },
  { value: DEFAULT_DISTANCE, label: "Within 100 miles" },
] as const;

function getValidPage(value: string | null) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function getJobsFromApiBody(body: unknown): Job[] {
  if (Array.isArray(body)) {
    return body as Job[];
  }

  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    Array.isArray((body as JobsApiResponse).data)
  ) {
    return (body as JobsApiResponse).data ?? [];
  }

  return [];
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);

    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
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
  const [page, setPage] = useState(getValidPage(searchParams.get("page")));

  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [newJobs, setNewJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const debouncedLocation = useDebouncedValue(
    location.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  useEffect(() => {
    const next = new URLSearchParams();

    if (debouncedQuery) next.set("q", debouncedQuery);
    if (debouncedLocation) next.set("location", debouncedLocation);
    if (dateFilter !== DEFAULT_POSTED) next.set("posted", dateFilter);
    if (distance !== DEFAULT_DISTANCE) next.set("distance", distance);
    if (page > 1) next.set("page", String(page));

    const nextQueryString = next.toString();
    const currentQueryString = searchParams.toString();

    if (nextQueryString !== currentQueryString) {
      router.replace(
        nextQueryString ? `${pathname}?${nextQueryString}` : pathname,
        {
          scroll: false,
        },
      );
    }
  }, [
    debouncedQuery,
    debouncedLocation,
    dateFilter,
    distance,
    page,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, debouncedLocation, dateFilter, distance]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
          daysAgo: dateFilter,
          distance,
        });

        if (debouncedQuery) {
          params.set("query", debouncedQuery);
        }

        if (debouncedLocation) {
          params.set("location", debouncedLocation);
        }

        const response = await fetch(`/api/jobs?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const body = (await response.json().catch(() => null)) as
          | JobsApiResponse
          | Job[]
          | null;

        if (!response.ok) {
          const message =
            body && !Array.isArray(body) && body.error
              ? body.error
              : "Could not load jobs.";

          throw new Error(message);
        }

        if (controller.signal.aborted) return;

        const nextJobs = getJobsFromApiBody(body);

        setJobs(nextJobs);
        setTotalJobs(
          body && !Array.isArray(body) && typeof body.total === "number"
            ? body.total
            : nextJobs.length,
        );
        setNewJobs(
          body && !Array.isArray(body) && typeof body.newJobs === "number"
            ? body.newJobs
            : 0,
        );
        setTotalPages(
          body && !Array.isArray(body) && typeof body.totalPages === "number"
            ? Math.max(1, body.totalPages)
            : 1,
        );
        hasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
      } catch (error) {
        if (controller.signal.aborted) return;

        if (!hasLoadedOnceRef.current) {
          setJobs([]);
          setTotalJobs(0);
          setNewJobs(0);
          setTotalPages(1);
        }

        setLoadError(
          error instanceof Error ? error.message : "Could not load jobs.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => controller.abort();
  }, [page, debouncedQuery, debouncedLocation, dateFilter, distance]);

  const cardJobs = useMemo(() => jobs.map(toJobCardShape), [jobs]);

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

  const getPageHref = (targetPage: number) => {
    const nextPage = Math.min(Math.max(1, targetPage), totalPages);
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const queryString = params.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  const goToPage = (targetPage: number) => {
    const next = Math.min(Math.max(1, targetPage), totalPages);
    setPage(next);

    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const resultStart = totalJobs > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const resultEnd = Math.min(currentPage * PAGE_SIZE, totalJobs);

  return (
    <main className="min-h-screen bg-background">
      <section
        className="relative overflow-hidden bg-hero-gradient px-4 py-12"
        aria-labelledby="jobs-page-title"
      >
        <div className="pointer-events-none absolute -top-24 right-[-10%] size-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-[-10%] size-72 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative mx-auto max-w-368 px-4 md:px-6 xl:px-8">
          <Badge variant="soft" className="gap-1.5">
            <Sparkles aria-hidden="true" className="size-3" />
            Search results
          </Badge>

          <h1
            id="jobs-page-title"
            className="mt-4 text-balance text-4xl font-bold tracking-tight md:text-5xl"
          >
            Find the role that moves your{" "}
            <span className="bg-linear-to-r from-primary to-[hsl(var(--hero-glow))] bg-clip-text text-transparent">
              career forward
            </span>
            .
          </h1>

          <form
            role="search"
            aria-label="Search jobs"
            className="mt-7 grid gap-2 rounded-2xl border border-border/70 bg-surface/95 p-2 shadow-lift backdrop-blur md:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
            }}
          >
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 transition-colors focus-within:border-primary/50">
              <Search
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />

              <label htmlFor="job-query" className="sr-only">
                Job title, skill, company, or keyword
              </label>

              <Input
                id="job-query"
                list="job-keyword-suggestions"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Job title, skill, company, or keyword"
                className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                autoComplete="off"
              />

              <datalist id="job-keyword-suggestions">
                {keywordSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 transition-colors focus-within:border-primary/50">
              <MapPin
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />

              <label htmlFor="job-location" className="sr-only">
                City, state, or remote
              </label>

              <Input
                id="job-location"
                list="job-location-suggestions"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="City, state, or remote"
                className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                autoComplete="address-level2"
              />

              <datalist id="job-location-suggestions">
                {locationSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </div>

            <Button type="submit" variant="hero" size="xl">
              Search jobs
            </Button>
          </form>
        </div>
      </section>

      <section
        className="mx-auto grid max-w-368 gap-8 px-4 py-8 md:px-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:px-8"
        aria-label="Job search results and filters"
      >
        <aside
          className="h-fit rounded-2xl border border-border/70 bg-surface p-6 shadow-soft lg:sticky lg:top-24"
          aria-labelledby="jobs-filters-heading"
        >
          <div className="flex items-center justify-between">
            <h2
              id="jobs-filters-heading"
              className="flex items-center gap-2 font-semibold"
            >
              <SlidersHorizontal
                aria-hidden="true"
                className="size-4 text-primary"
              />
              Filters
            </h2>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <X aria-hidden="true" className="size-3" />
                Clear
              </button>
            )}
          </div>

          <label
            htmlFor="posted-filter"
            className="mt-6 block text-sm font-medium"
          >
            Posted within
          </label>

          <div className="relative mt-2">
            <select
              id="posted-filter"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {postedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary"
            />
          </div>

          <label
            htmlFor="distance-filter"
            className="mt-6 block text-sm font-medium"
          >
            Distance
          </label>

          <div className="relative mt-2">
            <select
              id="distance-filter"
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {distanceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary"
            />
          </div>

          <div className="mt-6 space-y-2 border-t border-border/60 pt-5 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-3.5" />
              {dateFilter === DEFAULT_POSTED
                ? "Any time"
                : `${dateFilter} day window`}
            </p>

            <p className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-3.5" />
              {distance} mile radius
            </p>
          </div>
        </aside>

        <section className="space-y-5" aria-labelledby="job-results-heading">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="text-sm text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                {loading && !hasLoadedOnce ? (
                  "Loading jobs..."
                ) : (
                  <>
                    {totalJobs} {totalJobs === 1 ? "job" : "jobs"} found
                    {totalJobs > 0 && (
                      <>
                        {newJobs > 0 && <> ({newJobs} new)</>} · showing{" "}
                        <span className="font-medium text-foreground">
                          {resultStart}–{resultEnd}
                        </span>
                      </>
                    )}
                    {loading && hasLoadedOnce && (
                      <span className="ml-2 text-primary">Updating...</span>
                    )}
                  </>
                )}
              </p>

              <h2
                id="job-results-heading"
                className="text-2xl font-bold tracking-tight"
              >
                Recommended listings
              </h2>
            </div>

            <Button variant="glass" asChild>
              <Link href="/signin">Save search</Link>
            </Button>
          </div>

          {loading && !hasLoadedOnce ? (
            <div
              className="space-y-4"
              aria-label="Loading jobs"
              aria-busy="true"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
            </div>
          ) : loadError ? (
            <div
              className="rounded-2xl border border-dashed border-destructive/40 bg-card p-10 text-center"
              role="alert"
            >
              <h3 className="text-lg font-semibold">Could not load jobs</h3>

              <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            </div>
          ) : cardJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
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
              <ul className="space-y-4" aria-label="Job listings">
                {cardJobs.map((job) => (
                  <li key={job.id}>
                    <JobCard
                      job={job}
                      saved={isSaved(job.id)}
                      saving={pendingId === job.id}
                      onSave={toggleSaved}
                    />
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  className="flex flex-col items-center gap-3 pt-2"
                  aria-label="Job results pagination"
                >
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href={
                            currentPage === 1
                              ? getPageHref(1)
                              : getPageHref(currentPage - 1)
                          }
                          aria-disabled={currentPage === 1}
                          tabIndex={currentPage === 1 ? -1 : undefined}
                          onClick={(event) => {
                            event.preventDefault();

                            if (currentPage > 1) {
                              goToPage(currentPage - 1);
                            }
                          }}
                          className={cn(
                            currentPage === 1 &&
                              "pointer-events-none opacity-50",
                          )}
                        />
                      </PaginationItem>

                      {pageNumbers.map((pageNumber, index) => (
                        <PaginationItem key={`${pageNumber}-${index}`}>
                          {pageNumber === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              href={getPageHref(pageNumber)}
                              isActive={pageNumber === currentPage}
                              aria-current={
                                pageNumber === currentPage ? "page" : undefined
                              }
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
                          href={
                            currentPage === totalPages
                              ? getPageHref(totalPages)
                              : getPageHref(currentPage + 1)
                          }
                          aria-disabled={currentPage === totalPages}
                          tabIndex={currentPage === totalPages ? -1 : undefined}
                          onClick={(event) => {
                            event.preventDefault();

                            if (currentPage < totalPages) {
                              goToPage(currentPage + 1);
                            }
                          }}
                          className={cn(
                            currentPage === totalPages &&
                              "pointer-events-none opacity-50",
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>

                  <p className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                </nav>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}
