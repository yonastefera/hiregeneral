import { Sparkles } from "lucide-react";

import { currentPlanStats } from "./subscription-content";

export function CurrentPlanCard() {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950 p-5 text-white lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <Sparkles className="h-3 w-3" />
            Current plan
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Growth</h2>

          <p className="mt-1 text-[12px] text-white/60">
            Paid posting since{" "}
            <span className="font-medium text-white/90">January 14, 2026</span>
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-semibold tracking-tight">
            $299
            <span className="text-sm font-normal text-white/50">/mo</span>
          </div>

          <div className="mt-0.5 text-[11px] text-white/50">
            Renews June 1, 2026
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {currentPlanStats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white/5 p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/50">
              {stat.label}
            </div>
            <div className="mt-1 text-[14px] font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-neutral-900 transition hover:bg-white/90"
        >
          Upgrade plan
        </button>

        <button
          type="button"
          className="rounded-lg bg-white/10 px-4 py-2 text-[12px] font-medium text-white transition hover:bg-white/20"
        >
          Manage plan
        </button>
      </div>
    </section>
  );
}
