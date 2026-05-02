"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/jobs/JobCard";
import { SiteHeader } from "@/components/SiteHeader";
import { featuredJobs } from "@/data/jobPlatform";

export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [dateFilter, setDateFilter] = useState("30");
  const [distance, setDistance] = useState("50");
  const [saved, setSaved] = useState<string[]>([]);

  const filteredJobs = useMemo(
    () =>
      featuredJobs.filter((job) => {
        const textMatch = `${job.title} ${job.company} ${job.skills.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase());

        const locationMatch = location
          ? job.location.toLowerCase().includes(location.toLowerCase())
          : true;

        const dateMatch = job.postedDaysAgo <= Number(dateFilter);
        const distanceMatch =
          job.distance === 0 || job.distance <= Number(distance);

        return textMatch && locationMatch && dateMatch && distanceMatch;
      }),
    [query, location, dateFilter, distance]
  );

  const handleSave = (jobId: string) => {
    setSaved((current) =>
      current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId]
    );

    toast.info("Sign in to sync saved jobs across devices.");
  };

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero-gradient px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <Badge variant="soft">Search results</Badge>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Find the role that moves your career forward.
          </h1>

          <div className="mt-7 grid gap-3 rounded-lg border border-border bg-surface/90 p-3 shadow-lift backdrop-blur md:grid-cols-[1fr_1fr_auto]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Title, company, skill"
              className="h-12 rounded-lg bg-background"
            />

            <Input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="City, state, remote"
              className="h-12 rounded-lg bg-background"
            />

            <Button variant="hero" size="xl">
              Search jobs
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-border bg-surface p-5 shadow-soft">
          <div className="flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="size-4" />
            Filters
          </div>

          <label className="mt-5 block text-sm font-medium">
            Posted within
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="1">Last 24 hours</option>
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
              <option value="10">Within 10 miles</option>
              <option value="25">Within 25 miles</option>
              <option value="50">Within 50 miles</option>
              <option value="100">Within 100 miles</option>
            </select>
          </label>

          <div className="mt-5 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              {dateFilter} day window
            </p>

            <p className="flex items-center gap-2">
              <MapPin className="size-4" />
              {distance} mile radius
            </p>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {filteredJobs.length} jobs found
              </p>

              <h2 className="text-2xl font-bold tracking-tight">
                Recommended listings
              </h2>
            </div>

            <Button variant="glass" asChild>
              <Link href="/signin">Save search</Link>
            </Button>
          </div>

          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={saved.includes(job.id)}
              onSave={handleSave}
            />
          ))}
        </div>
      </section>
    </main>
  );
}