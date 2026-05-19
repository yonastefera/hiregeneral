import { Filter, Search } from "lucide-react";

import type { ResumeJobOption } from "./database-content";

type DatabaseToolbarProps = {
  selectedJob: string;
  onSelectedJobChange: (value: string) => void;
  jobOptions: ResumeJobOption[];
  query: string;
  onQueryChange: (value: string) => void;
  resumeOnly: boolean;
  onResumeOnlyChange: (value: boolean) => void;
  candidateCount: number;
};

export function DatabaseToolbar({
  selectedJob,
  onSelectedJobChange,
  jobOptions,
  query,
  onQueryChange,
  resumeOnly,
  onResumeOnlyChange,
  candidateCount,
}: DatabaseToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3">
      <label className="text-[12px] text-neutral-500" htmlFor="resume-job">
        Matching for:
      </label>

      <select
        id="resume-job"
        value={selectedJob}
        onChange={(event) => onSelectedJobChange(event.target.value)}
        disabled={jobOptions.length === 0}
        className="h-9 min-w-[220px] rounded-lg bg-neutral-50 px-3 text-[13px] font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-60"
        aria-label="Select job for resume matching"
      >
        {jobOptions.length === 0 ? (
          <option value="">Publish a job to rank candidates</option>
        ) : null}
        {jobOptions.map((jobOption) => (
          <option key={jobOption.id} value={jobOption.id}>
            {jobOption.title}
          </option>
        ))}
      </select>

      <label className="relative min-w-[220px] flex-1" htmlFor="resume-query">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          id="resume-query"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search name, title, skill, or location"
          className="h-9 w-full rounded-lg bg-neutral-50 pl-8 pr-3 text-[13px] outline-none transition placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
        />
      </label>

      <label className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-50 px-3 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-100">
        <input
          type="checkbox"
          checked={resumeOnly}
          onChange={(event) => onResumeOnlyChange(event.target.checked)}
          className="h-3.5 w-3.5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
        />
        <Filter className="h-3.5 w-3.5" />
        Has resume
      </label>

      <div className="ml-auto text-[11px] text-neutral-500">
        {candidateCount} candidates · sorted by skill match
      </div>
    </div>
  );
}
