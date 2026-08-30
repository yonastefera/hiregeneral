import type { EmployerHiringAnalytics } from "./employer-dashboard-data";

type DashboardHiringAnalyticsProps = {
  analytics: EmployerHiringAnalytics;
  premiumAnalytics: boolean;
};

function percent(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function DashboardHiringAnalytics({
  analytics,
  premiumAnalytics,
}: DashboardHiringAnalyticsProps) {
  const funnel = [
    ["Applied", analytics.funnel.applied],
    ["Reviewed", analytics.funnel.reviewed],
    ["Interviewed", analytics.funnel.interviewed],
    ["Offered", analytics.funnel.offered],
  ] as const;
  const maximumDaily = Math.max(
    1,
    ...analytics.dailyApplications.map((item) => item.applications),
  );

  return (
    <section className="rounded-2xl bg-white p-5">
      <div>
        <h2 className="text-[16px] font-semibold tracking-tight">
          Hiring analytics
        </h2>
        <p className="mt-0.5 text-[12px] text-neutral-500">
          Measured over the last {analytics.days} days.
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Candidate funnel
          </h3>
          <div className="mt-3 space-y-3">
            {funnel.map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between text-xs">
                  <span>{label}</span>
                  <span className="font-semibold">
                    {value} · {percent(value, analytics.funnel.applied)}%
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-teal-500 to-emerald-500"
                    style={{
                      width: `${percent(value, analytics.funnel.applied)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Daily applications
          </h3>
          <div
            className="mt-3 flex h-36 items-end gap-1"
            aria-label="Daily application trend"
          >
            {analytics.dailyApplications.slice(-14).map((item) => (
              <div
                key={item.date}
                className="group relative flex min-w-0 flex-1 items-end"
                title={`${item.date}: ${item.applications} applications`}
              >
                <div
                  className="w-full rounded-t bg-emerald-400 transition-colors group-hover:bg-emerald-500"
                  style={{
                    height: `${Math.max(4, (item.applications / maximumDaily) * 100)}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {analytics.funnel.rejected} candidates marked not selected.
          </p>
        </div>
      </div>

      {premiumAnalytics ? (
        <div className="mt-6 border-t border-neutral-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Job performance
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400">
                <tr>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 text-right font-medium">Applications</th>
                  <th className="py-2 text-right font-medium">Interviews</th>
                  <th className="py-2 text-right font-medium">Offers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {analytics.jobPerformance.slice(0, 10).map((job) => (
                  <tr key={job.jobId}>
                    <td className="max-w-64 truncate py-2 font-medium">
                      {job.title}
                    </td>
                    <td className="py-2 text-right">{job.applications}</td>
                    <td className="py-2 text-right">{job.interviews}</td>
                    <td className="py-2 text-right">{job.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
