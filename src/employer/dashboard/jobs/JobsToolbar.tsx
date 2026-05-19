import { Search } from "lucide-react";

import { jobTabs, type JobTab } from "./jobs-content";

type JobsToolbarProps = {
  activeTab: JobTab;
  query: string;
  totals: {
    all: number;
    active: number;
    draft: number;
    closed: number;
  };
  onActiveTabChange: (tab: JobTab) => void;
  onQueryChange: (query: string) => void;
};

export function JobsToolbar({
  activeTab,
  query,
  totals,
  onActiveTabChange,
  onQueryChange,
}: JobsToolbarProps) {
  const countByTab: Record<JobTab, number> = {
    All: totals.all,
    Active: totals.active,
    Draft: totals.draft,
    Closed: totals.closed,
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="inline-flex rounded-lg bg-neutral-100 p-0.5">
        {jobTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onActiveTabChange(tab)}
            className={`rounded-md px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {tab}
            <span className="ml-1 text-[10px] text-neutral-400">
              {countByTab[tab]}
            </span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />

        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search jobs"
          className="h-9 w-64 rounded-lg bg-neutral-50 pl-9 pr-3 text-[13px] outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>
    </div>
  );
}
