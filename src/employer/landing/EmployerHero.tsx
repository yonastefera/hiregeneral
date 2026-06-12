import { Star, TrendingUp } from "lucide-react";

import {
  employerLandingIcons,
  hiringMetrics,
  livePipelineJobs,
} from "./employer-landing-content";
import type { HiringCompany } from "./hiring-this-week";
import { getCompanyInitials } from "./employer-landing-utils";
import { EmployerTalentSearch } from "./EmployerTalentSearch";

const { CheckCircle2 } = employerLandingIcons;

type EmployerHeroProps = {
  companies: HiringCompany[];
};

export function EmployerHero({ companies }: EmployerHeroProps) {
  const totalOpenRoles = companies.reduce(
    (total, company) => total + company.roles,
    0,
  );
  const totalNewRoles = companies.reduce(
    (total, company) => total + company.newRoles,
    0,
  );
  const signalCompanies =
    companies.length > 0
      ? companies.slice(0, 3).map((company) => ({
          company: company.name,
          role: `${company.roles} open roles`,
          location: company.industry,
          applicants: company.newRoles,
          meta: company.newRoles > 0 ? "new this week" : "active now",
        }))
      : livePipelineJobs.map((job) => ({
          ...job,
          meta: `${job.ago} ago`,
        }));

  return (
    <section className="relative z-20 overflow-visible">
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

          <h1 className="mt-6 font-display text-[clamp(3.25rem,6vw,5.5rem)] font-normal leading-[0.98] tracking-[-0.04em]">
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

          <EmployerTalentSearch />

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
              <span className="uppercase tracking-widest">
                Live hiring signal
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                open
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">
                {totalOpenRoles > 0 ? totalOpenRoles : 284}
              </span>
              <span className="text-sm text-neutral-500">
                open roles across active hiring teams
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {signalCompanies.map((job) => (
                <article
                  key={`${job.company}-${job.role}`}
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
                      {job.applicants > 0 ? `+${job.applicants}` : "Open"}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {job.meta}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="absolute -left-6 -top-6 hidden items-center gap-2 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-lg md:flex">
            <TrendingUp className="size-4 text-emerald-600" />
            <div>
              <div className="text-[11px] text-neutral-500">Fresh roles</div>
              <div className="text-sm font-semibold">
                +{totalNewRoles} this week
              </div>
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
