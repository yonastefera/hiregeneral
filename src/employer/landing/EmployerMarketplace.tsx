import Link from "next/link";
import { ChevronRight } from "lucide-react";

import {
  employerLandingIcons,
  featuredCompanies,
  marketplaceFilters,
} from "./employer-landing-content";
import type { HiringCompany } from "./hiring-this-week";

const { Building2, Briefcase } = employerLandingIcons;

type EmployerMarketplaceProps = {
  companies: HiringCompany[];
};

const fallbackCompanies: HiringCompany[] = featuredCompanies.map((company) => ({
  ...company,
  newRoles: 0,
  logoUrl: null,
  website: null,
}));

function companyJobsHref(companyName: string) {
  const params = new URLSearchParams({
    query: companyName,
  });

  return `/jobs?${params.toString()}`;
}

export function EmployerMarketplace({ companies }: EmployerMarketplaceProps) {
  const displayCompanies = companies.length > 0 ? companies : fallbackCompanies;

  return (
    <section id="companies" className="bg-[oklch(0.99_0.01_180)]">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-teal-700">
              The marketplace
            </div>

            <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              Companies hiring this week
            </h2>

            <p className="mt-3 max-w-xl text-neutral-600">
              A curated wall of teams actively interviewing on HireGeneral.
              Every profile is designed to help candidates understand the
              company before they apply.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {marketplaceFilters.map((filter, index) => (
              <button
                key={filter}
                type="button"
                className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                  index === 0
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-black/10 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayCompanies.map((company) => (
            <article
              key={company.name}
              className="group relative rounded-3xl border border-black/5 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(20,30,50,0.24)]"
            >
              <div
                className={`absolute inset-x-0 top-0 h-24 rounded-t-3xl bg-linear-to-br ${company.accent} opacity-60`}
              />

              <div className="relative flex items-start justify-between">
                <div className="grid size-14 place-items-center rounded-2xl border border-black/5 bg-white shadow-sm">
                  <Building2 className="size-6 text-neutral-700" />
                </div>

                <span className="rounded-full border border-black/5 bg-white/80 px-2.5 py-1 text-[10px] uppercase tracking-widest text-neutral-700 backdrop-blur">
                  {company.newRoles > 0
                    ? `${company.newRoles} new`
                    : company.tag}
                </span>
              </div>

              <div className="relative mt-8">
                <h3 className="text-xl font-semibold tracking-tight">
                  {company.name}
                </h3>

                <p className="text-sm text-neutral-500">
                  {company.industry} · {company.size} employees
                </p>
              </div>

              <div className="relative mt-5 flex items-center justify-between border-t border-black/5 pt-5">
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <Briefcase className="size-4" />

                  <span>
                    <b className="font-semibold">{company.roles}</b> open roles
                  </span>
                </div>

                <Link
                  href={companyJobsHref(company.name)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 transition hover:text-teal-800"
                >
                  View open roles
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
