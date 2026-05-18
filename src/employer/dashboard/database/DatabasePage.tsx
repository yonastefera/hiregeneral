"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { DatabaseToolbar } from "./DatabaseToolbar";
import { ResumeMatchCard } from "./ResumeMatchCard";
import { ResumeOverlay } from "./ResumeOverlay";
import {
  jobMatchOptions,
  resumeMatches,
  type ResumeMatch,
} from "./database-content";

export function DatabasePage() {
  const [selectedJob, setSelectedJob] = useState("Senior Product Designer");
  const [activeResume, setActiveResume] = useState<ResumeMatch | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">
            Resume database
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Candidates matched to your active job descriptions.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-teal-50 to-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <Sparkles className="h-3 w-3" />
          AI-matched
        </div>
      </div>

      <DatabaseToolbar
        selectedJob={selectedJob}
        onSelectedJobChange={setSelectedJob}
        jobOptions={jobMatchOptions}
        candidateCount={resumeMatches.length}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {resumeMatches.map((candidate) => (
          <ResumeMatchCard
            key={candidate.name}
            candidate={candidate}
            onViewResume={() => setActiveResume(candidate)}
          />
        ))}
      </div>

      {activeResume ? (
        <ResumeOverlay
          candidate={activeResume}
          onClose={() => setActiveResume(null)}
        />
      ) : null}
    </div>
  );
}
