import Image from "next/image";

import type { Job } from "@/lib/db/types";
import { formatSalary, getJobTitle, supportedLogoUrl } from "./apply-utils";

type ApplySidebarProps = {
  job: Job;
  userEmail: string;
};

export default function ApplySidebar({ job, userEmail }: ApplySidebarProps) {
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
  );

  const title = getJobTitle(job);
  const logoUrl = supportedLogoUrl(job.company_logo_url);

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${job.company_name} logo`}
              width={40}
              height={40}
              className="size-10 rounded-md object-contain"
            />
          ) : (
            <div className="grid size-10 place-items-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
              {job.company_name.slice(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
              Applying for
            </p>
            <p className="truncate font-semibold">{title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {job.company_name}
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">{job.employment_type}</dd>
          </div>

          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Work mode</dt>
            <dd className="font-medium">{job.work_mode}</dd>
          </div>

          {salary && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Salary</dt>
              <dd className="font-medium">{salary}</dd>
            </div>
          )}

          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Location</dt>
            <dd className="text-right font-medium">{job.location}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Application tips</h2>

        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span aria-hidden="true" className="text-primary">
              •
            </span>
            Tailor your resume to highlight relevant experience.
          </li>

          <li className="flex gap-2">
            <span aria-hidden="true" className="text-primary">
              •
            </span>
            Keep your cover note short and specific.
          </li>

          <li className="flex gap-2">
            <span aria-hidden="true" className="text-primary">
              •
            </span>
            Double-check links to your portfolio work.
          </li>
        </ul>
      </div>

      {userEmail && (
        <p className="px-1 text-xs text-muted-foreground">
          Signed in as {userEmail}
        </p>
      )}
    </aside>
  );
}
