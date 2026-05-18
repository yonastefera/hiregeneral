import { CheckCircle2 } from "lucide-react";

import { recentActivity } from "./dashboard-overview-content";

export function DashboardRecentActivity() {
  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="text-[16px] font-semibold tracking-tight">
        Recent activity
      </h2>

      <div className="mt-4 space-y-3">
        {recentActivity.map((activity) => (
          <div
            key={`${activity.name}-${activity.description}`}
            className="flex items-start gap-2.5"
          >
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />

            <div className="min-w-0">
              <p className="text-[12px] leading-5 text-neutral-600">
                <span className="font-semibold text-neutral-900">
                  {activity.name}
                </span>{" "}
                {activity.description}
              </p>
              <p className="text-[10px] text-neutral-400">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
