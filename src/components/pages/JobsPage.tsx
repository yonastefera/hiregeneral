"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/jobs/JobCard";
import { featuredJobs } from "@/data/jobPlatform";
import { keywordSuggestions, locationSuggestions } from "@/data/suggestions";
import { useSavedJobs } from "@/hooks/useSavedJobs";

const DEFAULT_POSTED = "30";
const DEFAULT_DISTANCE = "100";

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

  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  useEffect(() => {
    const next = new URLSearchParams();

    if (query) next.set("q", query);
    if (location) next.set("location", location);
    if (dateFilter !== DEFAULT_POSTED) next.set("posted", dateFilter);
    if (distance !== DEFAULT_DISTANCE) next.set("distance", distance);

    const nextQuery = next.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }
  }, [query, location, dateFilter, distance, pathname, router, searchParams]);

  const filteredJobs = useMemo(
    () =>
      featuredJobs.filter((job) => {
        const haystack =
          `${job.title} ${job.company} ${job.category} ${job.skills.join(
            " ",
          )}`.toLowerCase();

        const textMatch = query ? haystack.includes(query.toLowerCase()) : true;

        const locationMatch = location
          ? job.location.toLowerCase().includes(location.toLowerCase())
          : true;

        const dateMatch = job.postedDaysAgo <= Number(dateFilter);
        const distanceMatch = job.distance <= Number(distance);

        return textMatch && locationMatch && dateMatch && distanceMatch;
      }),
    [query, location, dateFilter, distance],
  );

  const clearAll = () => {
    setQuery("");
    setLocation("");
    setDateFilter(DEFAULT_POSTED);
    setDistance(DEFAULT_DISTANCE);
  };

  const hasActiveFilters =
    Boolean(query || location) ||
    dateFilter !== DEFAULT_POSTED ||
    distance !== DEFAULT_DISTANCE;

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
              {dateFilter} day window
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
                {filteredJobs.length}{" "}
                {filteredJobs.length === 1 ? "job" : "jobs"} found
              </p>

              <h2 className="text-2xl font-bold tracking-tight">
                Recommended listings
              </h2>
            </div>

            <Button variant="glass" asChild>
              <Link href="/signin">Save search</Link>
            </Button>
          </div>

          {filteredJobs.length === 0 ? (
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
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                saved={isSaved(job.id)}
                saving={pendingId === job.id}
                onSave={toggleSaved}
              />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
