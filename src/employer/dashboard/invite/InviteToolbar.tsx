type InviteToolbarProps = {
  selectedJob: string;
  onSelectedJobChange: (value: string) => void;
  jobOptions: readonly string[];
  recommendationCount: number;
};

export function InviteToolbar({
  selectedJob,
  onSelectedJobChange,
  jobOptions,
  recommendationCount,
}: InviteToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3">
      <span className="text-[12px] text-neutral-500">Recommendations for:</span>

      <select
        value={selectedJob}
        onChange={(event) => onSelectedJobChange(event.target.value)}
        className="h-9 rounded-lg bg-neutral-50 px-3 text-[13px] font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-emerald-400/40"
        aria-label="Select job for candidate recommendations"
      >
        {jobOptions.map((jobOption) => (
          <option key={jobOption} value={jobOption}>
            {jobOption}
          </option>
        ))}
      </select>

      <div className="ml-auto text-[11px] text-neutral-500">
        {recommendationCount} top matches
      </div>
    </div>
  );
}
