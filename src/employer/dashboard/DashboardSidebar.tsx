"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavGroups } from "./dashboard-nav";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-58 flex-col bg-[#FAFAFB] lg:flex">
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {dashboardNavGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              {group.label}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;

              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                    active
                      ? "bg-white text-neutral-900"
                      : "text-neutral-600 hover:bg-white/70 hover:text-neutral-900"
                  }`}
                >
                  {active ? (
                    <span className="absolute -left-1 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-linear-to-b from-teal-500 to-emerald-500" />
                  ) : null}

                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      active
                        ? "text-emerald-600"
                        : "text-neutral-400 group-hover:text-neutral-700"
                    }`}
                  />

                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="m-3 overflow-hidden rounded-2xl bg-linear-to-br from-neutral-900 via-neutral-900 to-emerald-900 p-4 text-white">
        <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-300/80">
          Pro tip
        </div>

        <div className="mt-1.5 text-sm font-semibold leading-snug">
          Unlock unlimited posts and AI matching
        </div>

        <button className="mt-3 w-full rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-900 transition-colors hover:bg-white">
          Upgrade plan
        </button>
      </div>
    </aside>
  );
}
