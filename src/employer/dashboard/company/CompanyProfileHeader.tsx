import { Briefcase, Calendar, Camera, Link2 } from "lucide-react";

import type { companyProfile } from "./company-content";

type Company = typeof companyProfile;

type CompanyProfileHeaderProps = {
  company: Company;
};

export function CompanyProfileHeader({ company }: CompanyProfileHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <div className="h-32 bg-linear-to-br from-teal-400 via-emerald-500 to-cyan-500" />

      <div className="-mt-10 flex flex-wrap items-end justify-between gap-3 px-5 pb-5">
        <div className="flex items-end gap-3">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-linear-to-br from-neutral-900 to-neutral-700 text-xl font-bold text-white ring-4 ring-white">
              {company.initials}
            </div>

            <button
              type="button"
              aria-label="Update company logo"
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white text-neutral-700 ring-1 ring-black/6"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>

          <div className="pb-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {company.name}
            </h2>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                Created {company.createdAt}
              </span>

              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-2.5 w-2.5" />
                {company.activeJobs} active jobs
              </span>

              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
              >
                <Link2 className="h-2.5 w-2.5" />
                {company.websiteLabel}
              </a>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="rounded-lg bg-linear-to-b from-teal-500 to-emerald-600 px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
