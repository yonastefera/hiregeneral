import { Bell, ChevronDown, Search, Settings } from "lucide-react";

export function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-[#F5F5F7]/85 px-5 backdrop-blur-xl">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />

        <input
          placeholder="Search jobs, candidates, messages"
          className="h-9 w-full rounded-lg bg-white/80 pl-9 pr-3 text-[13px] text-neutral-800 outline-none ring-1 ring-black/4 transition-all placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-lg bg-white/80 text-neutral-600 ring-1 ring-black/4 transition-colors hover:text-neutral-900"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </button>

      <button
        type="button"
        aria-label="Settings"
        className="grid h-9 w-9 place-items-center rounded-lg bg-white/80 text-neutral-600 ring-1 ring-black/4 transition-colors hover:text-neutral-900"
      >
        <Settings className="h-4 w-4" />
      </button>

      <button
        type="button"
        className="flex items-center gap-2 rounded-lg bg-white/80 py-1 pl-1 pr-2.5 ring-1 ring-black/4"
      >
        <div className="grid h-7 w-7 place-items-center rounded-md bg-linear-to-br from-teal-400 to-emerald-500 text-[10px] font-semibold text-white">
          NA
        </div>

        <div className="text-[13px] font-medium">Nick A.</div>

        <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
      </button>
    </header>
  );
}
