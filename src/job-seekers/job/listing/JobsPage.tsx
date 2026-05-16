"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import LocationAutocomplete from "@/components/location/LocationAutocomplete";
import type { LocationSuggestion } from "@/components/location/location-types";
import KeywordAutocomplete from "@/components/search/KeywordAutocomplete";
import type { KeywordSuggestion } from "@/components/search/keyword-types";
import { Button } from "@/components/ui/button";
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
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { toJobCardShape } from "@/lib/jobs/card-shape";
import { cn } from "@/lib/utils";
import type { Job } from "@/lib/db/types";

const DEFAULT_POSTED = "3650";
const DEFAULT_DISTANCE = "100";
const PAGE_SIZE = 20;
const JOBS_CACHE_TTL_MS = 60_000;
const JOBS_BROWSE_SEED_KEY = "hg.jobsBrowseSeed.v1";
const PREFETCH_PAGE_COUNT = 2;

type JobsApiResponse = {
  data?: Job[];
  total?: number;
  newJobs?: number;
  totalPages?: number;
  error?: string;
};

type SelectedKeyword = {
  term: string;
  label: string;
  category: string | null;
};

type SelectedLocation = {
  city: string;
  state: string;
  zip_code: string | null;
  label: string;
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

function getStableBrowseSeed() {
  if (typeof window === "undefined") return "jobs:server";

  try {
    const existing = window.sessionStorage.getItem(JOBS_BROWSE_SEED_KEY);

    if (existing) return existing;

    const next = `jobs:${Date.now().toString(36)}:${Math.random()
      .toString(36)
      .slice(2)}`;

    window.sessionStorage.setItem(JOBS_BROWSE_SEED_KEY, next);

    return next;
  } catch {
    return `jobs:${Date.now().toString(36)}`;
  }
}

function getJobsCacheKey(params: URLSearchParams) {
  return `hg.jobs:${params.toString()}`;
}

function readJobsCache(cacheKey: string) {
  if (typeof window === "undefined") return null;

  try {
    const cached = window.sessionStorage.getItem(cacheKey);

    if (!cached) return null;

    const parsed = JSON.parse(cached) as {
      cachedAt?: number;
      body?: JobsApiResponse | Job[];
    };

    if (!parsed.cachedAt || Date.now() - parsed.cachedAt > JOBS_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parsed.body ?? null;
  } catch {
    return null;
  }
}

function writeJobsCache(cacheKey: string, body: JobsApiResponse | Job[]) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAt: Date.now(),
        body,
      }),
    );
  } catch {
    // Best effort only. Browsing should still work if storage is unavailable.
  }
}

function buildJobsApiParams(params: {
  page: number;
  pageSize: number;
  daysAgo: string;
  distance: string;
  seed: string;
  query: string;
  location: string;
}) {
  const next = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    daysAgo: params.daysAgo,
    distance: params.distance,
    loadMode: "page",
    seed: params.seed,
  });

  if (params.query.trim()) {
    next.set("query", params.query.trim());
  }

  if (params.location.trim()) {
    next.set("location", params.location.trim());
  }

  return next;
}

function queueBackgroundTask(task: () => void) {
  if (typeof window === "undefined") return;

  window.setTimeout(task, 150);
}

async function prefetchJobPages(params: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  daysAgo: string;
  distance: string;
  seed: string;
  query: string;
  location: string;
  signal: AbortSignal;
}) {
  const lastPage = Math.min(
    params.totalPages,
    params.currentPage + PREFETCH_PAGE_COUNT,
  );

  for (
    let nextPage = params.currentPage + 1;
    nextPage <= lastPage;
    nextPage += 1
  ) {
    if (params.signal.aborted) return;

    const nextParams = buildJobsApiParams({
      page: nextPage,
      pageSize: params.pageSize,
      daysAgo: params.daysAgo,
      distance: params.distance,
      seed: params.seed,
      query: params.query,
      location: params.location,
    });
    const cacheKey = getJobsCacheKey(nextParams);

    if (readJobsCache(cacheKey)) continue;

    try {
      const response = await fetch(`/api/jobs?${nextParams.toString()}`, {
        cache: "no-store",
        signal: params.signal,
      });

      if (!response.ok) continue;

      const body = (await response.json().catch(() => null)) as
        | JobsApiResponse
        | Job[]
        | null;

      if (body) {
        writeJobsCache(cacheKey, body);
      }
    } catch {
      if (params.signal.aborted) return;
    }
  }
}

function toSelectedKeyword(suggestion: KeywordSuggestion): SelectedKeyword {
  return {
    term: suggestion.term,
    label: suggestion.label,
    category: suggestion.category,
  };
}

function toSelectedLocation(location: LocationSuggestion): SelectedLocation {
  return {
    city: location.city,
    state: location.state,
    zip_code: location.zip_code,
    label: location.label,
  };
}

export default function JobsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialLocation = searchParams.get("location") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);

  const [location, setLocation] = useState(initialLocation);
  const [submittedLocation, setSubmittedLocation] = useState(initialLocation);

  const [, setSelectedKeyword] = useState<SelectedKeyword | null>(null);

  const [, setSelectedLocation] = useState<SelectedLocation | null>(null);

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
  const browseSeedRef = useRef(getStableBrowseSeed());

  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  const applyJobsBody = useCallback((body: JobsApiResponse | Job[] | null) => {
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
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();

    if (submittedQuery.trim()) {
      next.set("q", submittedQuery.trim());
    }

    if (submittedLocation.trim()) {
      next.set("location", submittedLocation.trim());
    }

    if (dateFilter !== DEFAULT_POSTED) {
      next.set("posted", dateFilter);
    }

    if (distance !== DEFAULT_DISTANCE) {
      next.set("distance", distance);
    }

    if (page > 1) {
      next.set("page", String(page));
    }

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
    submittedQuery,
    submittedLocation,
    dateFilter,
    distance,
    page,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    setPage(1);
  }, [submittedQuery, submittedLocation, dateFilter, distance]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      let servedCachedBody = false;

      try {
        const params = buildJobsApiParams({
          page,
          pageSize: PAGE_SIZE,
          daysAgo: dateFilter,
          distance,
          seed: browseSeedRef.current,
          query: submittedQuery,
          location: submittedLocation,
        });

        const cacheKey = getJobsCacheKey(params);
        const cachedBody = readJobsCache(cacheKey);

        if (cachedBody) {
          applyJobsBody(cachedBody);
          hasLoadedOnceRef.current = true;
          setHasLoadedOnce(true);
          servedCachedBody = true;
        }

        setLoading(!servedCachedBody);
        setLoadError(null);

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

        applyJobsBody(body);
        writeJobsCache(cacheKey, body ?? []);

        const nextTotalPages =
          body && !Array.isArray(body) && typeof body.totalPages === "number"
            ? Math.max(1, body.totalPages)
            : 1;

        if (nextTotalPages > page) {
          queueBackgroundTask(() => {
            void prefetchJobPages({
              currentPage: page,
              totalPages: nextTotalPages,
              pageSize: PAGE_SIZE,
              daysAgo: dateFilter,
              distance,
              seed: browseSeedRef.current,
              query: submittedQuery,
              location: submittedLocation,
              signal: controller.signal,
            });
          });
        }

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

        if (!servedCachedBody) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load jobs.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => controller.abort();
  }, [
    page,
    submittedQuery,
    submittedLocation,
    dateFilter,
    distance,
    applyJobsBody,
  ]);

  const cardJobs = useMemo(() => jobs.map(toJobCardShape), [jobs]);

  const clearAll = () => {
    setQuery("");
    setSelectedKeyword(null);
    setSubmittedQuery("");

    setLocation("");
    setSelectedLocation(null);
    setSubmittedLocation("");

    setDateFilter(DEFAULT_POSTED);
    setDistance(DEFAULT_DISTANCE);
    setPage(1);
  };

  const submitSearch = () => {
    setSubmittedQuery(query.trim());
    setSubmittedLocation(location.trim());
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(query || location || submittedQuery || submittedLocation) ||
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
        className="relative overflow-visible bg-hero-gradient px-4 py-12"
        aria-labelledby="jobs-page-title"
      >
        <div className="pointer-events-none absolute -top-24 right-[-10%] size-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-[-10%] size-72 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative mx-auto max-w-368 px-4 md:px-6 xl:px-8">
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
            className="relative z-30 mt-7 grid gap-2 rounded-2xl border border-border/70 bg-surface/95 p-2 shadow-lift backdrop-blur md:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <div className="relative rounded-xl border border-input bg-background transition-colors focus-within:border-primary/50">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
              />

              <label htmlFor="job-query" className="sr-only">
                Job title, skill, company, or keyword
              </label>

              <KeywordAutocomplete
                id="job-query"
                value={query}
                placeholder="Job title, skill, company, or keyword"
                showClearButton={false}
                className="h-12 border-0 bg-transparent pl-9 pr-3 shadow-none focus-visible:ring-0"
                onValueChange={(value) => {
                  setQuery(value);

                  if (!value.trim()) {
                    setSelectedKeyword(null);
                  }
                }}
                onKeywordSelect={(suggestion) => {
                  const nextKeyword = toSelectedKeyword(suggestion);

                  setSelectedKeyword(nextKeyword);
                  setQuery(nextKeyword.term);
                }}
                onClear={() => {
                  setSelectedKeyword(null);
                }}
              />
            </div>

            <div className="relative rounded-xl border border-input bg-background transition-colors focus-within:border-primary/50">
              <MapPin
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
              />

              <label htmlFor="job-location" className="sr-only">
                City, state, or ZIP
              </label>

              <LocationAutocomplete
                id="job-location"
                value={location}
                placeholder="City, state, or ZIP"
                showClearButton={false}
                className="h-12 border-0 bg-transparent pl-9 pr-3 shadow-none focus-visible:ring-0"
                onValueChange={(value) => {
                  setLocation(value);

                  if (!value.trim()) {
                    setSelectedLocation(null);
                  }
                }}
                onLocationSelect={(suggestion) => {
                  const nextLocation = toSelectedLocation(suggestion);

                  setSelectedLocation(nextLocation);
                  setLocation(nextLocation.label);
                }}
                onClear={() => {
                  setSelectedLocation(null);
                }}
              />
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
