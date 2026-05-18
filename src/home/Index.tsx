"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crosshair, MapPin, Search } from "lucide-react";

import LocationAutocomplete from "@/components/location/LocationAutocomplete";
import type { LocationSuggestion } from "@/components/location/location-types";
import KeywordAutocomplete from "@/components/search/KeywordAutocomplete";
import type { KeywordSuggestion } from "@/components/search/keyword-types";
import { JobCard } from "@/components/jobs/JobCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { flowCards, platformStats } from "@/data/jobPlatform";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { JobCardJob } from "@/lib/jobs/card-shape";

interface IndexProps {
  initialHighlightedJobs: JobCardJob[];
}

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

const publicFlows = flowCards.filter((flow) => flow.role !== "admin");

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

const Index = ({ initialHighlightedJobs }: IndexProps) => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selectedKeyword, setSelectedKeyword] =
    useState<SelectedKeyword | null>(null);

  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  const highlightedJobs = useMemo(
    () => initialHighlightedJobs,
    [initialHighlightedJobs],
  );

  const useMyLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationQuery("Current location");
        setSelectedLocation(null);
      },
      () => {
        setLocationError("Could not access your location.");
      },
    );
  };

  const searchJobs = () => {
    const params = new URLSearchParams();

    const trimmedQuery = query.trim();
    const trimmedLocation = locationQuery.trim();

    if (selectedKeyword) {
      params.set("q", selectedKeyword.term);
    } else if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (selectedLocation) {
      params.set("city", selectedLocation.city);
      params.set("state", selectedLocation.state);

      if (selectedLocation.zip_code) {
        params.set("zip", selectedLocation.zip_code);
      }

      params.set(
        "location",
        `${selectedLocation.city}, ${selectedLocation.state}`,
      );
    } else if (trimmedLocation) {
      params.set("location", trimmedLocation);
    }

    const queryString = params.toString();

    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  };

  return (
    <main className="min-h-screen bg-background" id="main-content">
      <section
        aria-labelledby="home-hero-heading"
        className="relative -mt-16 overflow-visible bg-hero-gradient px-4 pb-16 pt-24 md:pb-20 md:pt-28 lg:min-h-175"
      >
        <div
          className="pointer-events-none absolute -top-32 left-1/2 hidden h-112 w-md -translate-x-1/2 rounded-full bg-primary/15 blur-[120px] md:block motion-safe:animate-float"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-40 hidden h-72 w-72 rounded-full bg-accent/15 blur-[100px] md:block"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:pt-24">
          <div className="animate-reveal lg:pt-2">
            <h1
              id="home-hero-heading"
              className="mt-16 max-w-3xl text-balance text-5xl font-semibold tracking-[-0.04em] text-foreground md:text-7xl lg:text-[4.25rem] lg:leading-[0.95]"
            >
              Search smarter.{" "}
              <span className="text-gradient-primary">Hire faster.</span> Move
              with HireGeneral.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              A minimal job board for candidates and recruiters with public job
              search, secure saved listings, recruiter posting, and rich
              profiles.
            </p>

            <form
              role="search"
              aria-label="Job search"
              onSubmit={(event) => {
                event.preventDefault();
                searchJobs();
              }}
              className="mt-6 max-w-3xl"
            >
              <div className="grid gap-2 lg:grid-cols-[1fr_1fr_auto]">
                <div className="relative rounded-2xl bg-muted/50 transition-colors focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <KeywordAutocomplete
                    id="homeKeywordSearch"
                    value={query}
                    placeholder="Title, company, skill, keyword"
                    showClearButton={false}
                    className="h-12 border-0 bg-transparent pl-11 pr-4 shadow-none focus-visible:ring-0"
                    onValueChange={(value) => {
                      setQuery(value);

                      if (!value.trim()) {
                        setSelectedKeyword(null);
                      }
                    }}
                    onKeywordSelect={(suggestion) => {
                      setSelectedKeyword(toSelectedKeyword(suggestion));
                    }}
                    onClear={() => {
                      setSelectedKeyword(null);
                    }}
                  />
                </div>

                <div className="relative rounded-2xl bg-muted/50 transition-colors focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20">
                  <MapPin
                    className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <LocationAutocomplete
                    id="homeLocationSearch"
                    value={locationQuery}
                    placeholder="Location"
                    showClearButton={false}
                    className="h-12 border-0 bg-transparent pl-11 pr-12 shadow-none focus-visible:ring-0"
                    onValueChange={(value) => {
                      setLocationQuery(value);
                      setLocationError(null);

                      if (!value.trim()) {
                        setSelectedLocation(null);
                      }
                    }}
                    onLocationSelect={(location) => {
                      setSelectedLocation(toSelectedLocation(location));
                      setLocationError(null);
                    }}
                    onClear={() => {
                      setSelectedLocation(null);
                      setLocationError(null);
                    }}
                  />

                  <button
                    type="button"
                    aria-label="Use my location"
                    onClick={useMyLocation}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-primary transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Crosshair className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <Button variant="hero" size="xl" type="submit">
                  Search
                </Button>
              </div>

              {locationError ? (
                <p
                  className="mt-3 px-3 text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  {locationError}
                </p>
              ) : null}
            </form>
          </div>

          <aside
            aria-labelledby="featured-roles-heading"
            className="relative animate-reveal lg:pl-4"
          >
            <div className="rounded-4xl border border-border/60 bg-background/75 p-6 shadow-lift backdrop-blur-2xl lg:min-h-152">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Live market pulse
                  </p>

                  <h2
                    id="featured-roles-heading"
                    className="mt-1 text-xl font-semibold tracking-tight"
                  >
                    Today&apos;s featured roles
                  </h2>
                </div>

                <Badge variant="warm">620 new</Badge>
              </div>

              <div className="mt-5 space-y-4">
                {highlightedJobs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
                    Featured roles will appear after ingestion runs or please
                    check your network connection.
                  </div>
                ) : (
                  highlightedJobs.map((job) => (
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
            </div>
          </aside>
        </div>
      </section>

      <section
        aria-labelledby="platform-stats-heading"
        className="mx-auto max-w-7xl px-4 py-12"
      >
        <h2 id="platform-stats-heading" className="sr-only">
          Platform statistics
        </h2>

        <div className="grid gap-4 md:grid-cols-4">
          {platformStats.map((stat) => (
            <article
              key={stat.label}
              aria-label={`${stat.label}: ${stat.value}`}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-xs transition-shadow hover:shadow-soft"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-primary-gradient text-primary-foreground shadow-pop">
                <stat.icon className="size-5" aria-hidden="true" />
              </div>

              <p className="mt-5 text-3xl font-semibold tracking-tight">
                {stat.value}
              </p>

              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="marketplace-flows-heading"
        className="mx-auto max-w-7xl px-4 pb-20 mb-20"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="marketplace-flows-heading"
              className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Built for every side of the marketplace.
            </h2>
          </div>

          <Button variant="glass" asChild>
            <Link href="/employers" prefetch>
              For employers
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {publicFlows.map((flow) => (
            <article
              key={flow.role}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div
                className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />

              <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
                <flow.icon className="size-6" aria-hidden="true" />
              </div>

              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                {flow.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {flow.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Index;
