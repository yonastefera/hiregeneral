import { MapPin, Search, Star, TrendingUp } from "lucide-react";

import {
  employerLandingIcons,
  hiringMetrics,
  livePipelineJobs,
} from "./employer-landing-content";
import { getCompanyInitials } from "./employer-landing-utils";

const { CheckCircle2 } = employerLandingIcons;

export function EmployerHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_20%,oklch(0.95_0.08_190)_0%,transparent_60%),radial-gradient(50%_40%_at_85%_10%,oklch(0.94_0.08_30)_0%,transparent_60%),radial-gradient(40%_40%_at_50%_90%,oklch(0.96_0.05_150)_0%,transparent_60%)]"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/60 px-3 py-1 text-xs uppercase tracking-[0.18em] text-neutral-600">
            <span className="size-1.5 rounded-full bg-teal-500" />
            Employer marketplace · 2026
          </div>

          <h1 className="mt-6 text-[clamp(2.75rem,6vw,5rem)] font-semibold leading-[1.02] tracking-tight">
            Hire the{" "}
            <span className="font-serif italic text-teal-600">right</span>{" "}
            people.
            <br />
            Skip the{" "}
            <span className="line-through decoration-orange-400/70 decoration-[3px]">
              noise
            </span>
            .
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-600">
            HireGeneral is a curated marketplace where modern teams meet
            ambitious talent. Post a role in minutes, surface qualified
            candidates, and close offers without the spam.
          </p>

          <form className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-black/5 bg-white/80 p-2 shadow-sm backdrop-blur sm:flex-row">
            <label className="flex flex-1 items-center gap-2 px-4">
              <Search className="size-4 text-neutral-400" />
              <input
                placeholder="Role, skill, or department"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-neutral-400"
              />
            </label>

            <div className="hidden w-px bg-black/5 sm:block" />

            <label className="flex flex-1 items-center gap-2 px-4">
              <MapPin className="size-4 text-neutral-400" />
              <input
                placeholder="Location or remote"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-neutral-400"
              />
            </label>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-6 py-3 font-medium text-white transition hover:bg-teal-600"
            >
              Search talent
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
            {hiringMetrics.map((metric) => (
              <span key={metric} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-teal-600" />
                {metric}
              </span>
            ))}
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative rounded-3xl border border-black/5 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(20,30,50,0.25)]">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="uppercase tracking-widest">Live pipeline</span>
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                open
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">284</span>
              <span className="text-sm text-neutral-500">
                qualified applicants this week
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {livePipelineJobs.map((job) => (
                <article
                  key={job.role}
                  className="flex items-center gap-3 rounded-xl border border-black/5 p-3 transition hover:bg-neutral-50"
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-linear-to-br from-neutral-100 to-neutral-200 text-[10px] font-semibold text-neutral-600">
                    {getCompanyInitials(job.company)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] tracking-widest text-neutral-500">
                      {job.company}
                    </div>
                    <div className="truncate text-sm font-medium">
                      {job.role}
                    </div>
                    <div className="truncate text-xs text-neutral-500">
                      {job.location}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      +{job.applicants}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {job.ago} ago
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="absolute -left-6 -top-6 hidden items-center gap-2 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-lg md:flex">
            <TrendingUp className="size-4 text-emerald-600" />
            <div>
              <div className="text-[11px] text-neutral-500">Time-to-hire</div>
              <div className="text-sm font-semibold">−38% vs average</div>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-4 hidden items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-white shadow-lg md:flex">
            <Star className="size-4 text-amber-400" />
            <span className="text-xs">4.9 average employer rating</span>
          </div>
        </div>
      </div>
    </section>
  );
}
