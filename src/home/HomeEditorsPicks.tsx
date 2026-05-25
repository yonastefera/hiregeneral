"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Clock,
  DollarSign,
  MapPin,
  Star,
} from "lucide-react";

import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { JobCardJob } from "@/lib/jobs/card-shape";
import {
  getCompanyInitials,
  getJobCompany,
  getJobHref,
  getJobLocation,
  getJobMode,
  getJobPosted,
  getJobSalary,
  getJobTags,
  getJobTitle,
  getJobType,
  jobAccents,
  type HomeJob,
} from "./home-job-utils";

type HomeEditorsPicksProps = {
  jobs: JobCardJob[];
};

export default function HomeEditorsPicks({ jobs }: HomeEditorsPicksProps) {
  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  return (
    <section className="w-full bg-white" aria-labelledby="home-editors-heading">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-teal-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
              Hand-picked today
            </div>

            <h2
              id="home-editors-heading"
              className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl"
            >
              Roles our editors love.
            </h2>

            <p className="mt-3 max-w-lg text-neutral-600">
              A small, curated selection from the modern teams hiring on
              HireGeneral this week.
            </p>
          </div>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            Browse all roles{" "}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {jobs.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-black/10 bg-white p-8 text-sm text-neutral-500">
              Featured roles will appear after ingestion runs or please check
              your network connection.
            </div>
          ) : (
            jobs.slice(0, 4).map((rawJob, index) => {
              const job = rawJob as HomeJob;
              const company = getJobCompany(job);
              const title = getJobTitle(job);
              const location = getJobLocation(job);
              const posted = getJobPosted(job);
              const type = getJobType(job);
              const mode = getJobMode(job);
              const salary = getJobSalary(job);
              const tags = getJobTags(job);
              const accent = jobAccents[index % jobAccents.length];
              const saved = isSaved(job.id);
              const saving = pendingId === job.id;

              return (
                <article
                  key={job.id}
                  className="group relative flex h-65.5 flex-col overflow-hidden rounded-3xl border border-black/5 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-30px_rgba(20,30,50,0.25)]"
                >
                  <div
                    className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-linear-to-br ${accent} opacity-10 blur-2xl transition group-hover:opacity-25`}
                    aria-hidden="true"
                  />

                  <div className="relative flex items-start justify-between">
                    <Link
                      href={getJobHref(job)}
                      className={`grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br ${accent} text-sm font-bold text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`}
                      aria-label={`View ${title} at ${company}`}
                    >
                      {getCompanyInitials(company)}
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleSaved(job.id)}
                      disabled={saving}
                      aria-label={saved ? "Unsave job" : "Save job"}
                      aria-pressed={saved}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        saved
                          ? "bg-rose-50 text-rose-700"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      } disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2`}
                    >
                      <Star
                        className={`h-3 w-3 ${saved ? "fill-current" : ""}`}
                        aria-hidden="true"
                      />
                      {saved ? "Saved" : "Save"}
                    </button>
                  </div>

                  <Link
                    href={getJobHref(job)}
                    className="relative mt-5 block min-w-0 flex-1 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                  >
                    <p className="truncate text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                      {company}
                    </p>

                    <h3 className="mt-1 truncate text-xl font-semibold leading-tight tracking-tight">
                      {title}
                    </h3>

                    <div className="mt-3 flex min-w-0 items-center gap-x-4 gap-y-1 overflow-hidden text-xs text-neutral-500">
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <MapPin
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">{location}</span>
                      </span>

                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span className="whitespace-nowrap">{posted}</span>
                      </span>

                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Briefcase className="h-3 w-3" aria-hidden="true" />
                        {type}
                        {mode ? ` / ${mode}` : ""}
                      </span>
                    </div>

                    {tags.length > 0 ? (
                      <div className="mt-3 flex max-h-7 flex-wrap gap-1.5 overflow-hidden">
                        {tags.map((tag) => (
                          <span
                            key={String(tag)}
                            className="max-w-52 truncate rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700"
                          >
                            {String(tag)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Link>

                  <div className="relative mt-auto flex min-h-9 items-center justify-between border-t border-black/5 pt-4">
                    {salary ? (
                      <div className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-neutral-900">
                        <DollarSign
                          className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span className="truncate">{salary}</span>
                      </div>
                    ) : (
                      <span aria-hidden="true" />
                    )}

                    <Link
                      href={getJobHref(job)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                    >
                      View role
                      <ArrowUpRight
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
