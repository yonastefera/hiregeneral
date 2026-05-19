import { Filter, Search } from "lucide-react";

import type { CandidateJobFilter } from "./candidates-content";

type CandidatesToolbarProps = {
  filters: CandidateJobFilter[];
  selectedJob: string;
  onSelectedJobChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
};

export function CandidatesToolbar({
  filters,
  selectedJob,
  onSelectedJobChange,
  query,
  onQueryChange,
}: CandidatesToolbarProps) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />

          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search candidates by name, skill or location"
            className="h-10 w-full rounded-lg bg-neutral-50 pl-9 pr-3 text-[13px] outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>

        <select
          value={selectedJob}
          onChange={(event) => onSelectedJobChange(event.target.value)}
          className="h-10 rounded-lg bg-neutral-50 px-3 text-[13px] outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
          aria-label="Filter candidates by job"
        >
          {filters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-neutral-50 px-3.5 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>
    </div>
  );
}
