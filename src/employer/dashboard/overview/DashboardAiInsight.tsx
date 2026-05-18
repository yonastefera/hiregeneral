import Link from "next/link";
import { Sparkles } from "lucide-react";

export function DashboardAiInsight() {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950 p-5 text-white">
      <div className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
        <Sparkles className="h-3 w-3" />
        AI insights
      </div>

      <h2 className="mt-4 text-[18px] font-semibold tracking-tight">
        Your posts get 3× more applicants with salary ranges.
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-white/60">
        Edit your active roles to add compensation.
      </p>

      <Link
        href="/employers/dashboard/jobs"
        className="mt-4 inline-flex text-[12px] font-semibold text-emerald-300 hover:text-emerald-200"
      >
        Review jobs ↗
      </Link>
    </section>
  );
}
