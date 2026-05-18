import { Filter } from "lucide-react";

type DatabaseToolbarProps = {
  selectedJob: string;
  onSelectedJobChange: (value: string) => void;
  jobOptions: readonly string[];
  candidateCount: number;
};

export function DatabaseToolbar({
  selectedJob,
  onSelectedJobChange,
  jobOptions,
  candidateCount,
}: DatabaseToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3">
      <span className="text-[12px] text-neutral-500">Matching for:</span>

      <select
        value={selectedJob}
        onChange={(event) => onSelectedJobChange(event.target.value)}
        className="h-9 rounded-lg bg-neutral-50 px-3 text-[13px] font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
        aria-label="Select job for resume matching"
      >
        {jobOptions.map((jobOption) => (
          <option key={jobOption} value={jobOption}>
            {jobOption}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-50 px-3 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-100"
      >
        <Filter className="h-3.5 w-3.5" />
        Filters
      </button>

      <div className="ml-auto text-[11px] text-neutral-500">
        {candidateCount} candidates · sorted by match
      </div>
    </div>
  );
}
