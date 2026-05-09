"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crosshair, MapPin, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/jobs/JobCard";
import { JobCardSkeleton } from "@/components/jobs/JobLoadingSkeletons";
import { flowCards, platformStats } from "@/data/jobPlatform";
import { keywordSuggestions, locationSuggestions } from "@/data/suggestions";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { Job } from "@/lib/db/types";
import { toJobCardShape, type JobCardJob } from "@/lib/jobs/card-shape";

const Index = () => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [highlightedJobs, setHighlightedJobs] = useState<JobCardJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  const publicFlows = useMemo(
    () => flowCards.filter((flow) => flow.role !== "admin"),
    [],
  );

  useEffect(() => {
    let active = true;

    async function loadHighlightedJobs() {
      setJobsLoading(true);

      try {
        const params = new URLSearchParams({
          page: "1",
          pageSize: "3",
          daysAgo: "3650",
        });

        const response = await fetch(`/api/jobs?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Could not load jobs.");

        const body = await response.json();
        const jobs: Job[] = Array.isArray(body.data) ? body.data : [];

        if (!active) return;

        setHighlightedJobs(jobs.map(toJobCardShape));
      } catch {
        if (active) {
          setHighlightedJobs([]);
        }
      } finally {
        if (active) {
          setJobsLoading(false);
        }
      }
    }

    loadHighlightedJobs();

    return () => {
      active = false;
    };
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocation("Current location");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocation("Current location");
      },
      () => {
        setLocation("Current location");
      },
    );
  };

  const searchJobs = () => {
    const params = new URLSearchParams();

    if (query) params.set("q", query);
    if (location) params.set("location", location);

    const queryString = params.toString();

    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="relative -mt-16 overflow-hidden bg-hero-gradient px-4 pb-20 pt-28 md:pb-28 md:pt-36">
        <div className="pointer-events-none absolute -top-32 left-1/2 hidden h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px] md:block motion-safe:animate-float" />
        <div className="pointer-events-none absolute right-0 top-40 hidden h-72 w-72 rounded-full bg-accent/15 blur-[100px] md:block" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="animate-reveal">
            <Badge variant="soft" className="gap-2 px-3 py-1">
              <Sparkles className="size-3.5 text-accent" />
              Modern hiring marketplace
            </Badge>

            <h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold tracking-[-0.04em] text-foreground md:text-7xl">
              Search smarter.{" "}
              <span className="text-gradient-primary">Hire faster.</span> Move
              with HireGeneral.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              A minimal job board for candidates and recruiters with public job
              search, secure saved listings, recruiter posting, and rich
              profiles.
            </p>

            <div className="mt-10 rounded-3xl border border-border/60 bg-background/70 p-2.5 shadow-lift backdrop-blur-2xl">
              <div className="grid gap-2 lg:grid-cols-[1fr_1fr_auto]">
                <div className="flex items-center gap-2 rounded-2xl bg-muted/50 px-4 transition-colors focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20">
                  <Search className="size-5 text-muted-foreground" />

                  <Input
                    list="home-keyword-suggestions"
                    aria-label="Search by title, company, or skill"
                    placeholder="Title, company, skill, keyword"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />

                  <datalist id="home-keyword-suggestions">
                    {keywordSuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-muted/50 px-4 transition-colors focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20">
                  <MapPin className="size-5 text-muted-foreground" />

                  <Input
                    list="home-location-suggestions"
                    aria-label="Search by location"
                    placeholder="Location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />

                  <button
                    type="button"
                    aria-label="Use my location"
                    onClick={useMyLocation}
                    className="rounded-full p-2 text-primary transition hover:bg-secondary"
                  >
                    <Crosshair className="size-4" />
                  </button>

                  <datalist id="home-location-suggestions">
                    {locationSuggestions.map((suggestion) => (
                      <option key={suggestion} value={suggestion} />
                    ))}
                  </datalist>
                </div>

                <Button variant="hero" size="xl" onClick={searchJobs}>
                  Search
                </Button>
              </div>
            </div>
          </div>

          <div className="relative animate-reveal lg:pl-6">
            <div className="rounded-3xl border border-border/60 bg-background/70 p-5 shadow-lift backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Live market pulse
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Today&apos;s featured roles
                  </h2>
                </div>

                <Badge variant="warm">620 new</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {jobsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <JobCardSkeleton key={index} />
                  ))
                ) : highlightedJobs.length === 0 ? (
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
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-4">
          {platformStats.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-xs transition-shadow hover:shadow-soft"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-primary-gradient text-primary-foreground shadow-pop">
                <stat.icon className="size-5" />
              </div>

              <p className="mt-5 text-3xl font-semibold tracking-tight">
                {stat.value}
              </p>

              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="soft">Three tailored flows</Badge>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Built for every side of the marketplace.
            </h2>
          </div>

          <Button variant="glass" asChild>
            <Link href="/employers/dashboard">Employer dashboard</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {publicFlows.map((flow) => (
            <article
              key={flow.role}
              className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
                <flow.icon className="size-6" />
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
