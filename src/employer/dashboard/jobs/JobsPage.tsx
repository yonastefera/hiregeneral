"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { JobsTable } from "./JobsTable";
import { JobsToolbar } from "./JobsToolbar";
import { jobs, type JobTab } from "./jobs-content";

export function JobsPage() {
  const [activeTab, setActiveTab] = useState<JobTab>("All");

  const filteredJobs = useMemo(() => {
    if (activeTab === "All") {
      return jobs;
    }

    return jobs.filter((job) => job.status === activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Jobs</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            All your posted, drafted and closed roles.
          </p>
        </div>

        <Link
          href="/employers/dashboard/post-job"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-teal-500 to-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          Post another job
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white">
        <JobsToolbar activeTab={activeTab} onActiveTabChange={setActiveTab} />
        <JobsTable jobs={filteredJobs} />
      </div>
    </div>
  );
}
