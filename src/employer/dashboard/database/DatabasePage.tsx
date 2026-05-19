"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DatabaseToolbar } from "./DatabaseToolbar";
import {
  defaultResumeInviteMessage,
  type ResumeDatabaseData,
  type ResumeMatch,
} from "./database-content";
import { ResumeMatchCard } from "./ResumeMatchCard";
import { ResumeOverlay } from "./ResumeOverlay";

type DatabasePageProps = {
  initialData: ResumeDatabaseData;
};

export function DatabasePage({ initialData }: DatabasePageProps) {
  const [selectedJob, setSelectedJob] = useState(
    initialData.selectedJobId ?? "",
  );
  const [query, setQuery] = useState("");
  const [resumeOnly, setResumeOnly] = useState(false);
  const [data, setData] = useState(initialData);
  const [activeResume, setActiveResume] = useState<ResumeMatch | null>(null);
  const [invitingCandidateId, setInvitingCandidateId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(
      async () => {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();

        if (selectedJob) params.set("jobId", selectedJob);
        if (query.trim()) params.set("query", query.trim());
        if (resumeOnly) params.set("resumeOnly", "true");

        try {
          const response = await fetch(`/api/employers/database?${params}`, {
            signal: controller.signal,
          });
          const payload = (await response.json()) as
            | ResumeDatabaseData
            | { error?: string };

          if (!response.ok) {
            throw new Error(
              "error" in payload && payload.error
                ? payload.error
                : "Could not load resume database.",
            );
          }

          setData(payload as ResumeDatabaseData);
        } catch (loadError) {
          if (
            loadError instanceof DOMException &&
            loadError.name === "AbortError"
          ) {
            return;
          }

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load resume database.",
          );
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      },
      query.trim() ? 250 : 0,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, resumeOnly, selectedJob]);

  async function sendInvite(candidate: ResumeMatch) {
    if (!selectedJob) {
      setError("Publish or select a job before inviting candidates.");
      return;
    }

    setInvitingCandidateId(candidate.id);
    setError(null);

    try {
      const response = await fetch("/api/employers/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: candidate.id,
          jobId: selectedJob,
          message: defaultResumeInviteMessage,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not send invite.");
      }

      setData((currentData) => ({
        ...currentData,
        candidates: currentData.candidates.map((currentCandidate) =>
          currentCandidate.id === candidate.id
            ? { ...currentCandidate, invited: true }
            : currentCandidate,
        ),
      }));

      setActiveResume((currentCandidate) =>
        currentCandidate?.id === candidate.id
          ? { ...currentCandidate, invited: true }
          : currentCandidate,
      );
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Could not send invite.",
      );
    } finally {
      setInvitingCandidateId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">
            Resume database
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Search public candidate profiles and rank them against your open
            roles.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-teal-50 to-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <Sparkles className="h-3 w-3" />
          Skill-ranked
        </div>
      </div>

      <DatabaseToolbar
        selectedJob={selectedJob}
        onSelectedJobChange={setSelectedJob}
        jobOptions={data.jobs}
        query={query}
        onQueryChange={setQuery}
        resumeOnly={resumeOnly}
        onResumeOnlyChange={setResumeOnly}
        candidateCount={data.totalCandidates}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div
        className={
          loading
            ? "grid grid-cols-1 gap-3 opacity-60 md:grid-cols-2 xl:grid-cols-3"
            : "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
        }
      >
        {data.candidates.map((candidate) => (
          <ResumeMatchCard
            key={candidate.id}
            candidate={candidate}
            onViewResume={() => setActiveResume(candidate)}
            onInvite={() => sendInvite(candidate)}
            inviting={invitingCandidateId === candidate.id}
            canInvite={Boolean(selectedJob)}
          />
        ))}
      </div>

      {!loading && data.candidates.length === 0 ? (
        <div className="rounded-2xl bg-white px-5 py-10 text-center">
          <h2 className="text-sm font-semibold text-neutral-900">
            No public resumes found
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Try a broader search, clear the resume-only filter, or publish a job
            so candidates can be ranked against it.
          </p>
        </div>
      ) : null}

      {activeResume ? (
        <ResumeOverlay
          candidate={activeResume}
          onClose={() => setActiveResume(null)}
        />
      ) : null}
    </div>
  );
}
