import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { loadOperationsSnapshot } from "@/lib/operations/snapshot";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations | HireGeneral",
  robots: { index: false, follow: false },
};

const statusStyles = {
  healthy: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  degraded: "bg-amber-50 text-amber-800 ring-amber-200",
  unavailable: "bg-red-50 text-red-800 ring-red-200",
};

export default async function AdminOperationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) redirect("/jobs");

  const snapshot = await loadOperationsSnapshot();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
              Admin control center
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Production operations
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Last checked {new Date(snapshot.checkedAt).toLocaleString()}.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin-control-center/sources"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50"
            >
              Source details
            </Link>
            <Link
              href="/admin-control-center"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Refresh
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Overall status</h2>
              <p className="mt-1 text-sm text-slate-600">
                Availability, freshness, delivery, and configuration checks.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ring-1 ${statusStyles[snapshot.status]}`}
            >
              {snapshot.status}
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.checks.map((check) => (
            <article
              key={check.name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{check.name}</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${statusStyles[check.status]}`}
                >
                  {check.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                {check.summary}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Target: {check.target}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Alerting rules</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Configure an external uptime check against <code>/api/health</code>.
            Investigate any 503 immediately and sustained degraded checks using
            the thresholds above and the production incident runbook.
          </p>
        </section>
      </div>
    </main>
  );
}
