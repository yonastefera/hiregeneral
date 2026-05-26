import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { JobCardJob } from "@/lib/jobs/card-shape";
import {
  getCompanyInitials,
  getJobCompany,
  getJobHref,
  getJobLocation,
  getJobPosted,
  getJobTitle,
  getJobType,
  jobAccents,
  type HomeJob,
} from "./home-job-utils";

type HomeFeaturedRolesProps = {
  jobs: JobCardJob[];
};

export default function HomeFeaturedRoles({ jobs }: HomeFeaturedRolesProps) {
  return (
    <aside
      className="min-w-0 lg:col-span-5"
      aria-labelledby="home-featured-heading"
    >
      <div className="min-w-0 rounded-3xl border border-black/5 bg-white p-5 shadow-[0_30px_80px_-30px_rgba(20,30,50,0.25)]">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          <span>Live market pulse</span>

          <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
            {jobs.length > 0 ? `${jobs.length} featured` : "0 featured"}
          </span>
        </div>

        <h2 id="home-featured-heading" className="mt-2 text-sm font-semibold">
          Today&apos;s featured roles
        </h2>

        <div className="mt-3 space-y-2.5">
          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-white p-5 text-sm text-neutral-500">
              Featured roles will appear after ingestion runs or please check
              your network connection.
            </div>
          ) : (
            jobs.slice(0, 4).map((rawJob, index) => {
              const job = rawJob as HomeJob;
              const company = getJobCompany(job);
              const title = getJobTitle(job);
              const accent = jobAccents[index % jobAccents.length];

              return (
                <article
                  key={job.id}
                  className="group relative block min-w-0 rounded-2xl border border-black/5 p-3 transition hover:bg-neutral-50"
                >
                  <Link
                    href={getJobHref(job)}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                    aria-label={`View ${title} at ${company}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} text-[12px] font-bold text-white`}
                        aria-hidden="true"
                      >
                        {getCompanyInitials(company)}
                      </div>

                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-[10px] font-medium uppercase tracking-widest text-neutral-500">
                          {company}
                        </p>

                        <h3 className="truncate text-sm font-semibold">
                          {title}
                        </h3>

                        <div className="mt-0.5 flex min-w-0 items-center gap-2 overflow-hidden text-[11px] text-neutral-500">
                          <span className="min-w-0 truncate">
                            {getJobLocation(job)}
                          </span>
                          <span className="shrink-0" aria-hidden="true">
                            /
                          </span>
                          <span className="shrink-0">{getJobPosted(job)}</span>
                          <span className="shrink-0" aria-hidden="true">
                            /
                          </span>
                          <span className="shrink-0">{getJobType(job)}</span>
                        </div>
                      </div>

                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neutral-900 text-white">
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
