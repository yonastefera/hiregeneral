import Link from "next/link";
import { Plus } from "lucide-react";

import { DashboardAiInsight } from "./DashboardAiInsight";
import { DashboardCurrentRoles } from "./DashboardCurrentRoles";
import { DashboardRecentActivity } from "./DashboardRecentActivity";
import { DashboardStatCards } from "./DashboardStatCards";
import type { EmployerDashboardData } from "./employer-dashboard-data";

type DashboardOverviewPageProps = {
  data: EmployerDashboardData;
};

export function DashboardOverviewPage({ data }: DashboardOverviewPageProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">
            Good morning, Nick
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Here&apos;s what&apos;s happening with your hiring pipeline today.
          </p>
        </div>

        <Link
          href="/employers/dashboard/post-job"
          className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-b from-teal-500 to-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          Post a job
        </Link>
      </div>

      <DashboardStatCards stats={data.stats} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <DashboardCurrentRoles jobs={data.jobs} />

        <div className="space-y-4">
          <DashboardAiInsight />
          <DashboardRecentActivity activity={data.recentActivity} />
        </div>
      </div>
    </div>
  );
}
