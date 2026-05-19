"use client";

import { useEffect, useRef, useState } from "react";

import { CandidateCard } from "./CandidateCard";
import { CandidatesToolbar } from "./CandidatesToolbar";
import type { EmployerCandidatesData } from "./candidates-content";

type CandidatesPageProps = {
  initialData: EmployerCandidatesData;
};

export function CandidatesPage({ initialData }: CandidatesPageProps) {
  const [selectedJob, setSelectedJob] = useState("all");
  const [query, setQuery] = useState("");
  const [data, setData] = useState(initialData);
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

        const params = new URLSearchParams({ jobId: selectedJob });

        if (query.trim()) {
          params.set("query", query.trim());
        }

        try {
          const response = await fetch(`/api/employers/candidates?${params}`, {
            signal: controller.signal,
          });
          const payload = (await response.json()) as
            | EmployerCandidatesData
            | { error?: string };

          if (!response.ok) {
            throw new Error(
              "error" in payload && payload.error
                ? payload.error
                : "Could not load candidates.",
            );
          }

          setData(payload as EmployerCandidatesData);
        } catch (fetchError) {
          if (
            fetchError instanceof DOMException &&
            fetchError.name === "AbortError"
          ) {
            return;
          }

          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Could not load candidates.",
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
  }, [query, selectedJob]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Candidates</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          All applicants for your active roles.
        </p>
      </div>

      <CandidatesToolbar
        filters={data.filters}
        selectedJob={selectedJob}
        onSelectedJobChange={setSelectedJob}
        query={query}
        onQueryChange={setQuery}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className={loading ? "space-y-2 opacity-60" : "space-y-2"}>
        {data.candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}

        {!loading && data.candidates.length === 0 ? (
          <div className="rounded-2xl bg-white px-5 py-10 text-center">
            <h2 className="text-sm font-semibold text-neutral-900">
              No candidates yet
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Applications for your jobs will appear here as candidates apply.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
