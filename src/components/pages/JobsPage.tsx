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
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1"));

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

    const nextQuery = next.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
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

        if (debouncedQuery) {
          params.set("query", debouncedQuery);
        }

        if (debouncedLocation) {
          params.set("location", debouncedLocation);
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
        setNewJobs(Number(body.newJobs ?? 0));
        setTotalPages(Number(body.totalPages ?? 1));
        hasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
      } catch (error) {
        if (!active) return;

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
        if (active) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      active = false;
    };
  }, [page, debouncedQuery, debouncedLocation, dateFilter]);

  const cardJobs = useMemo(() => jobs.map(toJobCardShape), [jobs]);

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
      <section className="relative overflow-hidden bg-hero-gradient px-4 py-12">
        <div className="pointer-events-none absolute -top-24 right-[-10%] size-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-[-10%] size-72 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative mx-auto max-w-368 px-4 md:px-6 xl:px-8">
          <Badge variant="soft" className="gap-1.5">
            <Sparkles className="size-3" />
            Search results
          </Badge>

          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Find the role that moves your{" "}
            <span className="bg-linear-to-r from-primary to-[hsl(var(--hero-glow))] bg-clip-text text-transparent">
              career forward
            </span>
            .
          </h1>

          <div className="mt-7 grid gap-2 rounded-2xl border border-border/70 bg-surface/95 p-2 shadow-lift backdrop-blur md:grid-cols-[1fr_1fr_auto]">
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 transition-colors focus-within:border-primary/50">
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

            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 transition-colors focus-within:border-primary/50">
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

      <section className="mx-auto grid max-w-368 gap-8 px-4 py-8 md:px-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:px-8">
        <aside className="h-fit rounded-2xl border border-border/70 bg-surface p-6 shadow-soft lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="size-4 text-primary" />
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

          <label className="mt-6 block text-sm font-medium">
            Posted within
            <div className="relative mt-2">
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm transition-colors focus:border-primary/50 focus:outline-none"
              >
                <option value="1">Last 24 hours</option>
                <option value="3">Last 3 days</option>
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
                <option value="3650">Any time</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
            </div>
          </label>

          <label className="mt-6 block text-sm font-medium">
            Distance
            <div className="relative mt-2">
              <select
                value={distance}
                onChange={(event) => setDistance(event.target.value)}
                className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm transition-colors focus:border-primary/50 focus:outline-none"
              >
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
                <option value="100">Within 100 miles</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
            </div>
          </label>

          <div className="mt-6 space-y-2 border-t border-border/60 pt-5 text-xs text-muted-foreground">
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

        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {loading && !hasLoadedOnce ? (
                  "Loading jobs..."
                ) : (
                  <>
                    {totalJobs} {totalJobs === 1 ? "job" : "jobs"} found
                    {totalJobs > 0 && (
                      <>
                        {newJobs > 0 && <> ({newJobs} new)</>} · showing{" "}
                        <span className="font-medium text-foreground">
                          {(currentPage - 1) * PAGE_SIZE + 1}–
                          {Math.min(currentPage * PAGE_SIZE, totalJobs)}
                        </span>
                      </>
                    )}
                    {loading && hasLoadedOnce && (
                      <span className="ml-2 text-primary">Updating...</span>
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

          {loading && !hasLoadedOnce ? (
            <div className="space-y-4" aria-label="Loading jobs">
              {Array.from({ length: 5 }).map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-dashed border-destructive/40 bg-card p-10 text-center">
              <h3 className="text-lg font-semibold">Could not load jobs</h3>

              <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
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

              <div className="flex flex-col items-center gap-3 pt-2">
                <Pagination>
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

                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
