import type { DashboardStat } from "./dashboard-overview-content";

type DashboardStatCardsProps = {
  stats: DashboardStat[];
};

export function DashboardStatCards({ stats }: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <section key={stat.label} className="rounded-2xl bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 text-emerald-600">
                <Icon className="h-4 w-4" />
              </div>

              {stat.change ? (
                <span
                  className={`text-[11px] font-semibold ${
                    stat.changeTone === "positive"
                      ? "text-emerald-600"
                      : "text-rose-500"
                  }`}
                >
                  {stat.change}
                </span>
              ) : null}
            </div>

            <div className="mt-4 text-2xl font-semibold tracking-tight">
              {stat.value}
            </div>

            <div className="text-[12px] text-neutral-500">{stat.label}</div>
          </section>
        );
      })}
    </div>
  );
}
