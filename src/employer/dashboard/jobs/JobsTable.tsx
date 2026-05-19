import Link from "next/link";
import { ArrowUpRight, Edit3, Eye, ShieldQuestion, Users } from "lucide-react";

import type { EmployerJob, JobStatus } from "./jobs-content";

type JobsTableProps = {
  jobs: EmployerJob[];
};

const statusClassNames: Record<JobStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Draft: "bg-amber-50 text-amber-700",
  Closed: "bg-neutral-100 text-neutral-600",
};

function formatDaysLive(job: EmployerJob) {
  if (job.status === "Draft" || job.posted === "—") return "—";
  if (job.daysLive === 0) return "Today";

  return `${job.daysLive}d`;
}

export function JobsTable({ jobs }: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <h2 className="text-sm font-semibold text-neutral-900">
          No jobs match this view
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Try another status, search term, or post a new role.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-neutral-400">
            <th className="px-5 py-2.5 font-medium">Role</th>
            <th className="px-5 py-2.5 font-medium">Posted</th>
            <th className="px-5 py-2.5 font-medium">Days live</th>
            <th className="px-5 py-2.5 font-medium">Views</th>
            <th className="px-5 py-2.5 font-medium">Applicants</th>
            <th className="px-5 py-2.5 font-medium">Status</th>
            <th className="px-5 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-t border-neutral-100 transition-colors hover:bg-neutral-50/60"
            >
              <td className="px-5 py-3.5 text-[13px] font-semibold">
                <div>
                  <div>{job.title}</div>
                  <div className="mt-0.5 text-[11px] font-normal text-neutral-500">
                    {job.location} · {job.employmentType}
                  </div>
                </div>
              </td>

              <td className="px-5 py-3.5 text-[13px] text-neutral-600">
                {job.posted}
              </td>

              <td className="px-5 py-3.5 text-[13px] text-neutral-600">
                {formatDaysLive(job)}
              </td>

              <td className="px-5 py-3.5 text-[13px] text-neutral-600">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3 text-neutral-400" />
                  {job.views.toLocaleString()}
                </span>
              </td>

              <td className="px-5 py-3.5 text-[13px] text-neutral-600">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3 text-neutral-400" />
                  {job.applicants}
                </span>
              </td>

              <td className="px-5 py-3.5">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    statusClassNames[job.status]
                  }`}
                >
                  {job.status}
                </span>
              </td>

              <td className="px-5 py-3.5 text-right">
                <div className="flex justify-end gap-1">
                  <Link
                    href={`/employers/dashboard/post-job?jobId=${job.id}`}
                    aria-label={`Edit ${job.title}`}
                    title="Edit job and screening questions"
                    className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    {job.status === "Draft" ? (
                      <Edit3 className="h-4 w-4" />
                    ) : (
                      <ShieldQuestion className="h-4 w-4" />
                    )}
                  </Link>

                  {job.slug && job.status === "Active" ? (
                    <Link
                      href={`/jobs/${job.slug}`}
                      aria-label={`View ${job.title}`}
                      className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
