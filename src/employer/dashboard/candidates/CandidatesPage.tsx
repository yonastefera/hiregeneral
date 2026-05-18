"use client";

import { useMemo, useState } from "react";

import { CandidateCard } from "./CandidateCard";
import { CandidatesToolbar } from "./CandidatesToolbar";
import { candidateJobFilters, candidates } from "./candidates-content";

export function CandidatesPage() {
  const [selectedJob, setSelectedJob] = useState("All jobs");

  const filteredCandidates = useMemo(() => {
    if (selectedJob === "All jobs") {
      return candidates;
    }

    return candidates.filter((candidate) => candidate.job === selectedJob);
  }, [selectedJob]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Candidates</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          All applicants for your active roles.
        </p>
      </div>

      <CandidatesToolbar
        filters={candidateJobFilters}
        selectedJob={selectedJob}
        onSelectedJobChange={setSelectedJob}
      />

      <div className="space-y-2">
        {filteredCandidates.map((candidate) => (
          <CandidateCard key={candidate.name} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}
