import { CheckCircle2 } from "lucide-react";

import type { RecentActivity } from "./dashboard-overview-content";

type DashboardRecentActivityProps = {
  activity: RecentActivity[];
};

export function DashboardRecentActivity({
  activity,
}: DashboardRecentActivityProps) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="text-[16px] font-semibold tracking-tight">
        Recent activity
      </h2>

      {activity.length > 0 ? (
        <div className="mt-4 space-y-3">
          {activity.map((activityItem) => (
            <div
              key={`${activityItem.name}-${activityItem.description}-${activityItem.time}`}
              className="flex items-start gap-2.5"
            >
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />

              <div className="min-w-0">
                <p className="text-[12px] leading-5 text-neutral-600">
                  <span className="font-semibold text-neutral-900">
                    {activityItem.name}
                  </span>{" "}
                  {activityItem.description}
                </p>
                <p className="text-[10px] text-neutral-400">
                  {activityItem.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-[12px] leading-5 text-neutral-500">
          New applications and hiring updates will appear here.
        </p>
      )}
    </section>
  );
}
