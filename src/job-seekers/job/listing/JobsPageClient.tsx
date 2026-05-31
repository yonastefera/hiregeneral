"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import dynamic from "next/dynamic";
import type { LocationSuggestion } from "@/components/location/location-types";
import type { KeywordSuggestion } from "@/components/search/keyword-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KeywordAutocomplete = dynamic(
  () => import("@/components/search/KeywordAutocomplete"),
  {
    ssr: false,
    loading: () => (
      <input
        disabled
        placeholder="Job title, skill, company, or keyword"
        className="h-12 w-full rounded-xl border-0 bg-transparent pl-9 pr-3 text-sm text-muted-foreground shadow-none outline-none"
      />
    ),
  },
);

const LocationAutocomplete = dynamic(
  () => import("@/components/location/LocationAutocomplete"),
  {
    ssr: false,
    loading: () => (
      <input
        disabled
        placeholder="City, state, or ZIP"
        className="h-12 w-full rounded-xl border-0 bg-transparent pl-9 pr-3 text-sm text-muted-foreground shadow-none outline-none"
      />
    ),
  },
);

import {
  buildJobsUrlParams,
  DEFAULT_DISTANCE,
  DEFAULT_POSTED,
  distanceOptions,
  postedOptions,
  type JobsSearchState,
} from "./search-options";

type JobsPageClientProps = {
  initialState: JobsSearchState;
  children: ReactNode;
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
  children,
}: JobsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
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

  /**
   * Keep the client form fields aligned with the URL/server state.
   * This is important when users navigate with browser back/forward buttons.
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

  const hasActiveFilters =
    Boolean(query || location || submittedQuery || submittedLocation) ||
    dateFilter !== DEFAULT_POSTED ||
    distance !== DEFAULT_DISTANCE;

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

        <div
          className={cn(
            "min-w-0 transition-opacity",
            isPending && "opacity-70",
          )}
        >
          {children}
        </div>
      </section>
    </main>
  );
}
