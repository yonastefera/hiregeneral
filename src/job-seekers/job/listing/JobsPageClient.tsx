"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Laptop,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type { LocationSuggestion } from "@/components/location/location-types";
import type { KeywordSuggestion } from "@/components/search/keyword-types";
import { cn } from "@/lib/utils";

import {
  buildJobsUrlParams,
  DEFAULT_DISTANCE,
  DEFAULT_POSTED,
  DEFAULT_WORK_MODE,
  distanceOptions,
  postedOptions,
  workModeOptions,
  type JobsSearchState,
} from "./search-options";

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

type JobsPageClientProps = {
  initialState: JobsSearchState;
  children: ReactNode;
};

function getLocationLabel(suggestion: LocationSuggestion) {
  return (
    suggestion.label ||
    [suggestion.city, suggestion.state].filter(Boolean).join(", ")
  ).trim();
}

function BigStat({
  n,
  l,
  tone,
  small,
}: {
  n: string;
  l: string;
  tone: "electric" | "coral" | "violet";
  small?: boolean;
}) {
  const accent =
    tone === "electric"
      ? "text-electric"
      : tone === "coral"
        ? "text-accent"
        : "text-violet-pop";

  return (
    <div className="flex flex-col">
      <span
        className={cn(
          "font-display leading-none tracking-tight",
          accent,
          small ? "text-3xl" : "hg-metric-value",
        )}
      >
        {n}
      </span>
      <span className="hg-metric-label">{l}</span>
    </div>
  );
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

  const [dateFilter, setDateFilter] = useState(initialState.dateFilter);
  const [distance, setDistance] = useState(initialState.distance);
  const [workMode, setWorkMode] = useState(
    initialState.workMode ?? DEFAULT_WORK_MODE,
  );
  const [easyApply, setEasyApply] = useState(Boolean(initialState.easyApply));

  useEffect(() => {
    setQuery(initialState.query);
    setSubmittedQuery(initialState.query);

    setLocation(initialState.location);
    setSubmittedLocation(initialState.location);

    setDateFilter(initialState.dateFilter);
    setDistance(initialState.distance);
    setWorkMode(initialState.workMode ?? DEFAULT_WORK_MODE);
    setEasyApply(Boolean(initialState.easyApply));
  }, [
    initialState.query,
    initialState.location,
    initialState.dateFilter,
    initialState.distance,
    initialState.workMode,
    initialState.easyApply,
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
    setSubmittedQuery("");

    setLocation("");
    setSubmittedLocation("");

    setDateFilter(DEFAULT_POSTED);
    setDistance(DEFAULT_DISTANCE);
    setWorkMode(DEFAULT_WORK_MODE);
    setEasyApply(false);

    navigateToState(
      {
        query: "",
        location: "",
        dateFilter: DEFAULT_POSTED,
        distance: DEFAULT_DISTANCE,
        workMode: DEFAULT_WORK_MODE,
        easyApply: false,
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
        workMode,
        easyApply,
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
        workMode,
        easyApply,
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
        workMode,
        easyApply,
        page: 1,
      },
      { scrollToTop: true },
    );
  };

  const updateWorkMode = (nextWorkMode: string) => {
    setWorkMode(nextWorkMode);

    navigateToState(
      {
        query: submittedQuery,
        location: submittedLocation,
        dateFilter,
        distance,
        workMode: nextWorkMode,
        easyApply,
        page: 1,
      },
      { scrollToTop: true },
    );
  };

  const updateEasyApply = (nextEasyApply: boolean) => {
    setEasyApply(nextEasyApply);

    navigateToState(
      {
        query: submittedQuery,
        location: submittedLocation,
        dateFilter,
        distance,
        workMode,
        easyApply: nextEasyApply,
        page: 1,
      },
      { scrollToTop: true },
    );
  };

  const hasActiveFilters =
    Boolean(query || location || submittedQuery || submittedLocation) ||
    dateFilter !== DEFAULT_POSTED ||
    distance !== DEFAULT_DISTANCE ||
    workMode !== DEFAULT_WORK_MODE ||
    easyApply;

  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <section
        className="relative z-20 overflow-visible bg-ink text-background"
        aria-labelledby="jobs-page-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-salary-hero-gradient opacity-90" />
        <div className="pointer-events-none absolute -left-32 top-10 size-130 rounded-full bg-primary/40 blur-[160px]" />
        <div className="pointer-events-none absolute -right-32 top-40 size-120 rounded-full bg-accent/40 blur-[160px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 size-105 rounded-full bg-violet-pop/40 blur-[160px]" />
        <div className="pointer-events-none absolute inset-0 noise-dark opacity-50" />

        <div className="hg-hero-inner relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="hg-eyebrow">
              <span className="hg-eyebrow-dot" />
              Live roles · refreshed hourly
            </div>
            <div className="hidden items-center gap-2 font-mono-tag text-[10px] text-background/60 md:inline-flex">
              <span>Search engine</span>
              <span className="h-px w-8 bg-background/30" />
              <span className="text-electric">v.04</span>
            </div>
          </div>

          <h1 id="jobs-page-title" className="hg-hero-title">
            Find work
            <br />
            <span className="text-gradient-electric italic">that fits</span>
            <br />
            <span className="text-gradient-warm">your next move.</span>
          </h1>

          <div className="mt-10 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <p className="hg-hero-copy">
              Every active role across the network — sharper filters, no noise,
              no dead listings, no recruiter spam.
            </p>
            <div className="hidden gap-6 md:flex">
              <BigStat n="620" l="New today" tone="electric" />
              <BigStat n="148" l="Hiring fast" tone="coral" />
              <BigStat n="412" l="Remote" tone="violet" />
            </div>
          </div>

          <form
            role="search"
            aria-label="Search jobs"
            className="relative z-50 mt-12 grid gap-2 overflow-visible rounded-2xl border border-background/15 bg-background/[0.04] p-2 shadow-lift backdrop-blur-2xl md:grid-cols-[1.2fr_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <div className="relative rounded-xl bg-background px-4 text-foreground transition-colors focus-within:ring-2 focus-within:ring-primary/20">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-primary"
              />

              <label htmlFor="job-query" className="sr-only">
                Job title, skill, company, or keyword
              </label>

              <KeywordAutocomplete
                id="job-query"
                value={query}
                placeholder="Job title, skill, company, or keyword"
                showClearButton={false}
                className="h-14 border-0 bg-transparent pl-8 pr-0 text-[15px] shadow-none focus-visible:ring-0"
                onValueChange={setQuery}
                onKeywordSelect={(suggestion: KeywordSuggestion) => {
                  setQuery(suggestion.term);
                }}
              />
            </div>

            <div className="relative rounded-xl bg-background px-4 text-foreground transition-colors focus-within:ring-2 focus-within:ring-accent/20">
              <MapPin
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-accent"
              />

              <label htmlFor="job-location" className="sr-only">
                City, state, or ZIP
              </label>

              <LocationAutocomplete
                id="job-location"
                value={location}
                placeholder="City, state, or ZIP"
                showClearButton={false}
                className="h-14 border-0 bg-transparent pl-8 pr-0 text-[15px] shadow-none focus-visible:ring-0"
                onValueChange={setLocation}
                onLocationSelect={(suggestion: LocationSuggestion) => {
                  setLocation(getLocationLabel(suggestion));
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-electric px-7 font-display text-[15px] font-semibold tracking-tight text-ink transition-all hover:shadow-pop active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              {isPending ? "Searching..." : "Search"}
              <Search className="size-4 transition-transform group-hover:scale-110" />
            </button>
          </form>

          <div className="mt-8 grid grid-cols-3 gap-3 md:hidden">
            <BigStat n="620" l="New today" tone="electric" small />
            <BigStat n="148" l="Hiring fast" tone="coral" small />
            <BigStat n="412" l="Remote" tone="violet" small />
          </div>
        </div>

        <div className="marquee-mask relative border-t border-background/10 bg-background/[0.02] py-4">
          <div className="flex items-center gap-8 whitespace-nowrap font-mono-tag text-[11px] text-background/50">
            {[
              "Engineering",
              "Design",
              "Product",
              "Data",
              "Marketing",
              "Sales",
              "Operations",
              "Finance",
              "Healthcare",
              "Engineering",
              "Design",
              "Product",
              "Data",
              "Marketing",
            ].map((category, index) => (
              <span
                key={`${category}-${index}`}
                className="inline-flex items-center gap-8"
              >
                <span className="size-1 rounded-full bg-electric" />
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative z-0 mx-auto mb-20 grid w-full max-w-368 gap-8 px-4 py-8 md:px-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:px-8"
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

          <label
            htmlFor="work-mode-filter"
            className="mt-6 block text-sm font-medium"
          >
            Work setting
          </label>

          <div className="relative mt-2">
            <select
              id="work-mode-filter"
              value={workMode}
              onChange={(event) => updateWorkMode(event.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {workModeOptions.map((option) => (
                <option key={option.value || "any"} value={option.value}>
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
            htmlFor="easy-apply-filter"
            className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-3 text-sm font-medium transition-colors hover:border-primary/40"
          >
            <input
              id="easy-apply-filter"
              type="checkbox"
              checked={easyApply}
              onChange={(event) => updateEasyApply(event.target.checked)}
              className="size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            Easy apply
          </label>

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

            {workMode && (
              <p className="flex items-center gap-2">
                <Laptop aria-hidden="true" className="size-3.5" />
                {workMode}
              </p>
            )}

            {easyApply && (
              <p className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                Easy apply
              </p>
            )}
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
