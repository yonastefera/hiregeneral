import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import type {
  CandidateSearchFilters,
  ResumeJobOption,
} from "./database-content";

type DatabaseToolbarProps = {
  selectedJob: string;
  onSelectedJobChange: (value: string) => void;
  jobOptions: ResumeJobOption[];
  query: string;
  onQueryChange: (value: string) => void;
  resumeOnly: boolean;
  onResumeOnlyChange: (value: boolean) => void;
  candidateCount: number;
  filters: CandidateSearchFilters;
  onFiltersChange: (filters: CandidateSearchFilters) => void;
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
  filters,
  onFiltersChange,
}: DatabaseToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const updateFilter = <K extends keyof CandidateSearchFilters>(
    key: K,
    value: CandidateSearchFilters[K],
  ) => onFiltersChange({ ...filters, [key]: value });

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill || filters.skills.length >= 10) return;
    if (
      !filters.skills.some((item) => item.toLowerCase() === skill.toLowerCase())
    ) {
      updateFilter("skills", [...filters.skills, skill]);
    }
    setSkillInput("");
  };

  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
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

        <button
          type="button"
          onClick={() => setAdvancedOpen((current) => !current)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-50 px-3 text-[13px] font-medium text-neutral-700"
        >
          <SlidersHorizontal className="size-3.5" /> Advanced
        </button>

        <div className="ml-auto text-[11px] text-neutral-500">
          {candidateCount} candidates · sorted by skill match
        </div>
      </div>

      {advancedOpen ? (
        <div className="mt-3 border-t border-neutral-100 pt-3">
          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            <input
              value={filters.location}
              onChange={(event) => updateFilter("location", event.target.value)}
              placeholder="Location"
              aria-label="Candidate location"
              className="h-9 rounded-lg bg-neutral-50 px-3 text-sm"
            />
            <input
              value={filters.experience}
              onChange={(event) =>
                updateFilter("experience", event.target.value)
              }
              placeholder="Experience level"
              aria-label="Experience level"
              className="h-9 rounded-lg bg-neutral-50 px-3 text-sm"
            />
            <input
              value={filters.industry}
              onChange={(event) => updateFilter("industry", event.target.value)}
              placeholder="Industry"
              aria-label="Industry"
              className="h-9 rounded-lg bg-neutral-50 px-3 text-sm"
            />
            <input
              value={filters.degree}
              onChange={(event) => updateFilter("degree", event.target.value)}
              placeholder="Highest degree"
              aria-label="Highest degree"
              className="h-9 rounded-lg bg-neutral-50 px-3 text-sm"
            />
            <select
              value={filters.relocation}
              onChange={(event) =>
                updateFilter(
                  "relocation",
                  event.target.value as CandidateSearchFilters["relocation"],
                )
              }
              aria-label="Relocation preference"
              className="h-9 rounded-lg bg-neutral-50 px-3 text-sm"
            >
              <option value="any">Any relocation preference</option>
              <option value="yes">Open to relocation</option>
            </select>
            <select
              value={filters.sort}
              onChange={(event) =>
                updateFilter(
                  "sort",
                  event.target.value as CandidateSearchFilters["sort"],
                )
              }
              aria-label="Candidate sorting"
              className="h-9 rounded-lg bg-neutral-50 px-3 text-sm"
            >
              <option value="match">Best match</option>
              <option value="recent">Recently updated</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add required skill"
              aria-label="Required skill"
              className="h-9 min-w-52 rounded-lg bg-neutral-50 px-3 text-sm"
            />
            <button
              type="button"
              onClick={addSkill}
              className="h-9 rounded-lg border border-neutral-200 px-3 text-sm font-medium"
            >
              Add skill
            </button>
            {filters.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
              >
                {skill}
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  onClick={() =>
                    updateFilter(
                      "skills",
                      filters.skills.filter((item) => item !== skill),
                    )
                  }
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
