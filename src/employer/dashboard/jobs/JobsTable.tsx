import { Eye, MoreHorizontal, Users } from "lucide-react";

import type { EmployerJob, JobStatus } from "./jobs-content";

type JobsTableProps = {
  jobs: EmployerJob[];
};

const statusClassNames: Record<JobStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Draft: "bg-amber-50 text-amber-700",
  Closed: "bg-neutral-100 text-neutral-600",
};

export function JobsTable({ jobs }: JobsTableProps) {
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
              key={job.title}
              className="border-t border-neutral-100 transition-colors hover:bg-neutral-50/60"
            >
              <td className="px-5 py-3.5 text-[13px] font-semibold">
                {job.title}
              </td>

              <td className="px-5 py-3.5 text-[13px] text-neutral-600">
                {job.posted}
              </td>

              <td className="px-5 py-3.5 text-[13px] text-neutral-600">
                {job.daysLive || "—"}
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
                <button
                  type="button"
                  aria-label={`Open actions for ${job.title}`}
                  className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
