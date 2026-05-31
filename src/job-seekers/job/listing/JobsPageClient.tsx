"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
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
import { JobCard } from "@/components/jobs/JobCard";
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
import { toJobCardShape } from "@/lib/jobs/card-shape";
import { cn } from "@/lib/utils";

import {
  buildJobsUrlParams,
  DEFAULT_DISTANCE,
  DEFAULT_POSTED,
  distanceOptions,
  PAGE_SIZE,
  postedOptions,
  type JobsPageData,
  type JobsSearchState,
} from "./search-options";

type JobsPageClientProps = {
  initialState: JobsSearchState;
  initialData: JobsPageData;
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

export default function JobsPageClient({
  initialState,
  initialData,
}: JobsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialState.query);
  const [submittedQuery, setSubmittedQuery] = useState(initialState.query);

  const [location, setLocation] = useState(initialState.location);
  const [submittedLocation, setSubmittedLocation] = useState(
    initialState.location,
  );

  const [, setSelectedKeyword] = useState<SelectedKeyword | null>(null);
  const [, setSelectedLocation] = useState<SelectedLocation | null>(null);

  const [dateFilter, setDateFilter] = useState(initialState.dateFilter);
  const [distance, setDistance] = useState(initialState.distance);

  const jobs = initialData.jobs;
  const totalJobs = initialData.totalJobs;
  const newJobs = initialData.newJobs;
  const totalPages = initialData.totalPages;
  const currentPage = Math.min(initialState.page, totalPages);

  /**
   * Keep local form inputs aligned when the server sends new search params.
   * This matters for back/forward navigation and URL-driven updates.
   */
  useEffect(() => {
    setQuery(initialState.query);
    setSubmittedQuery(initialState.query);

    setLocation(initialState.location);
    setSubmittedLocation(initialState.location);

    setDateFilter(initialState.dateFilter);
    setDistance(initialState.distance);
  }, [
    initialState.query,
    initialState.location,
    initialState.dateFilter,
    initialState.distance,
  ]);

  /**
   * Public /jobs should not load Supabase saved-job logic on first page load.
   * Clicking save sends the visitor to sign in and preserves the current route.
   */
  const handlePublicSave = useCallback(() => {
    const queryString = searchParams.toString();
    const currentPath = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(`/signin?next=${encodeURIComponent(currentPath)}`);
  }, [pathname, router, searchParams]);

  const navigateToState = useCallback(
    (nextState: JobsSearchState, options?: { scrollToTop?: boolean }) => {
      const nextParams = buildJobsUrlParams(nextState);
      const nextQueryString = nextParams.toString();
      const nextHref = nextQueryString
        ? `${pathname}?${nextQueryString}`
        : pathname;

      startTransition(() => {
        router.push(nextHref, { scroll: false });
      });

      if (options?.scrollToTop) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [pathname, router],
  );

  const clearAll = () => {
    setQuery("");
    setSelectedKeyword(null);
    setSubmittedQuery("");

    setLocation("");
    setSelectedLocation(null);
    setSubmittedLocation("");

    setDateFilter(DEFAULT_POSTED);
    setDistance(DEFAULT_DISTANCE);

    navigateToState(
      {
        query: "",
        location: "",
        dateFilter: DEFAULT_POSTED,
        distance: DEFAULT_DISTANCE,
        page: 1,
      },
      { scrollToTop: true },
    );
  };

  const submitSearch = () => {
    const nextQuery = query.trim();
    const nextLocation = location.trim();

    setSubmittedQuery(nextQuery);
    setSubmittedLocation(nextLocation);

    navigateToState(
      {
        query: nextQuery,
        location: nextLocation,
        dateFilter,
        distance,
        page: 1,
      },
      { scrollToTop: true },
    );
  };

  const updateDateFilter = (nextDateFilter: string) => {
    setDateFilter(nextDateFilter);

    navigateToState(
      {
        query: submittedQuery,
        location: submittedLocation,
        dateFilter: nextDateFilter,
        distance,
        page: 1,
      },
      { scrollToTop: true },
    );
  };

  const updateDistance = (nextDistance: string) => {
    setDistance(nextDistance);

    navigateToState(
      {
        query: submittedQuery,
        location: submittedLocation,
        dateFilter,
        distance: nextDistance,
        page: 1,
      },
      { scrollToTop: true },
    );
  };

  const goToPage = (targetPage: number) => {
    const nextPage = Math.min(Math.max(1, targetPage), totalPages);

    navigateToState(
      {
        query: submittedQuery,
        location: submittedLocation,
        dateFilter,
        distance,
        page: nextPage,
      },
      { scrollToTop: true },
    );
  };

  const hasActiveFilters =
    Boolean(query || location || submittedQuery || submittedLocation) ||
    dateFilter !== DEFAULT_POSTED ||
    distance !== DEFAULT_DISTANCE;

  const getPageHref = (targetPage: number) => {
    const nextPage = Math.min(Math.max(1, targetPage), totalPages);
    const params = new URLSearchParams(searchParams.toString());

    /**
     * Normalize legacy q= into query= for pagination links.
     */
    const legacyQuery = params.get("q");

    if (!params.get("query") && legacyQuery) {
      params.set("query", legacyQuery);
    }

    params.delete("q");

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const queryString = params.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
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

  const cardJobs = useMemo(() => jobs.map(toJobCardShape), [jobs]);

  const resultStart = totalJobs > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const resultEnd = Math.min(currentPage * PAGE_SIZE, totalJobs);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <section
        className="relative overflow-visible bg-hero-gradient px-4 py-12"
        aria-labelledby="jobs-page-title"
      >
        <div className="pointer-events-none absolute -top-24 right-[-10%] size-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-[-10%] size-72 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative mx-auto w-full max-w-368 px-4 md:px-6 xl:px-8">
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

            <Button type="submit" variant="hero" size="xl" disabled={isPending}>
              {isPending ? "Searching..." : "Search jobs"}
            </Button>
          </form>
        </div>
      </section>

      <section
        className="mx-auto mb-20 grid w-full max-w-368 gap-8 px-4 py-8 md:px-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:px-8"
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
              onChange={(event) => updateDateFilter(event.target.value)}
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
              onChange={(event) => updateDistance(event.target.value)}
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

        <section
          className="min-w-0 space-y-5"
          aria-labelledby="job-results-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="text-sm text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                {totalJobs} {totalJobs === 1 ? "job" : "jobs"} found
                {totalJobs > 0 && (
                  <>
                    {newJobs > 0 && <> ({newJobs} new)</>} · showing{" "}
                    <span className="font-medium text-foreground">
                      {resultStart}–{resultEnd}
                    </span>
                  </>
                )}
                {isPending && (
                  <span className="ml-2 text-primary">Updating...</span>
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

          {cardJobs.length === 0 ? (
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
              <ul className="min-w-0 space-y-4" aria-label="Job listings">
                {cardJobs.map((job) => (
                  <li key={job.id}>
                    <JobCard
                      job={job}
                      saved={false}
                      saving={false}
                      onSave={handlePublicSave}
                    />
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  className="flex flex-col items-center gap-3 pt-2"
                  aria-label="Job results pagination"
                >
                  <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-border/70 bg-surface p-2 shadow-xs sm:hidden">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || isPending}
                      onClick={() => {
                        if (currentPage > 1) {
                          goToPage(currentPage - 1);
                        }
                      }}
                      className="justify-self-start"
                    >
                      Previous
                    </Button>

                    <p className="text-xs font-medium text-muted-foreground">
                      Page{" "}
                      <span className="text-foreground">{currentPage}</span> of{" "}
                      <span className="text-foreground">{totalPages}</span>
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || isPending}
                      onClick={() => {
                        if (currentPage < totalPages) {
                          goToPage(currentPage + 1);
                        }
                      }}
                      className="justify-self-end"
                    >
                      Next
                    </Button>
                  </div>

                  <Pagination className="hidden sm:flex">
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

                  <p className="hidden text-xs text-muted-foreground sm:block">
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
