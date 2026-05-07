"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Search, Sparkles } from "lucide-react";

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

  const searchJobs = () => {
    const params = new URLSearchParams();

    if (query) params.set("q", query);
    if (location) params.set("location", location);

    const queryString = params.toString();

    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="relative -mt-16 overflow-hidden bg-hero-gradient px-4 pb-16 pt-24 md:pb-24 md:pt-32">
        <div className="pointer-events-none absolute left-1/2 top-24 hidden h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/50 blur-3xl md:block motion-safe:animate-float" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="animate-reveal">
            <Badge variant="soft" className="gap-2">
              <Sparkles className="size-3.5" />
              Modern hiring marketplace
            </Badge>

            <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-foreground text-balance md:text-7xl">
              Search smarter. Hire faster. Move with general.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              A minimal job board for candidates and recruiters with public job
              search, secure saved listings, recruiter posting, and rich
              profiles.
            </p>

            <div className="mt-8 rounded-lg border border-border bg-surface/90 p-3 shadow-lift backdrop-blur">
              <p className="px-2 pb-3 text-sm font-semibold text-foreground">
                Start your job search
              </p>

              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
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

                <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3">
                  <MapPin className="size-5 text-muted-foreground" />

                  <Input
                    list="home-location-suggestions"
                    aria-label="Search by location"
                    placeholder="Location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />

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
            <div className="rounded-lg border border-border bg-surface/80 p-4 shadow-lift backdrop-blur">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Live market pulse
                  </p>
                  <h2 className="text-xl font-bold tracking-tight">
                    Today’s featured roles
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
                  <div className="rounded-lg border border-dashed border-border bg-background p-5 text-sm text-muted-foreground">
                    Featured roles will appear after ingestion runs.
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

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-4">
          {platformStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-surface p-5 shadow-soft"
            >
              <stat.icon className="size-5 text-primary" />
              <p className="mt-4 text-3xl font-bold tracking-tight">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="soft">Three tailored flows</Badge>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Built for every side of the marketplace.
            </h2>
          </div>

          <Button variant="glass" asChild>
            <Link href="/employers/dashboard">Employer dashboard</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {publicFlows.map((flow) => (
            <article
              key={flow.role}
              className="rounded-lg border border-border bg-surface p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
            >
              <flow.icon className="size-7 text-primary" />

              <h3 className="mt-5 text-xl font-bold tracking-tight">
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
