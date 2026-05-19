import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { EmployerJob } from "../jobs/jobs-content";
import type { CurrentRole } from "./dashboard-overview-content";

const statusClassNames: Record<CurrentRole["status"], string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Draft: "bg-neutral-100 text-neutral-600",
};

function mapRole(job: EmployerJob): CurrentRole & { href: string | null } {
  return {
    id: job.id,
    title: job.title,
    meta: `${job.employmentType} · ${job.location}`,
    applicants: job.applicants,
    status: job.status === "Active" ? "Active" : "Draft",
    href: job.slug && job.status === "Active" ? `/jobs/${job.slug}` : null,
  };
}

type DashboardCurrentRolesProps = {
  jobs: EmployerJob[];
};

export function DashboardCurrentRoles({ jobs }: DashboardCurrentRolesProps) {
  const roles = jobs
    .filter((job) => job.status !== "Closed")
    .slice(0, 4)
    .map(mapRole);

  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight">
            Current roles
          </h2>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Manage active jobs, drafts and applicants.
          </p>
        </div>

        <Link
          href="/employers/dashboard/jobs"
          className="text-[12px] font-semibold text-emerald-600 hover:text-emerald-700"
        >
          View all →
        </Link>
      </div>

      {roles.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {roles.map((role) => (
            <div
              key={role.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-4 py-3"
            >
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-semibold">
                  {role.title}
                </h3>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  {role.meta}
                </p>
              </div>

              <div className="text-right">
                <div className="text-[13px] font-semibold">
                  {role.applicants}
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                  Applicants
                </div>
              </div>

              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  statusClassNames[role.status]
                }`}
              >
                {role.status}
              </span>

              {role.href ? (
                <Link
                  href={role.href}
                  aria-label={`Open ${role.title}`}
                  className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="h-7 w-7" />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-neutral-900">
            No active or draft roles yet
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Your first posted job will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
