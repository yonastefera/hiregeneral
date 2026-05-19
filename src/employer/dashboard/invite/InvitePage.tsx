"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { InviteCandidateCard } from "./InviteCandidateCard";
import { InviteMessageOverlay } from "./InviteMessageOverlay";
import { InviteToolbar } from "./InviteToolbar";
import {
  defaultInviteMessage,
  type InvitePageData,
  type RecommendedCandidate,
} from "./invite-content";

type InvitePageProps = {
  initialData: InvitePageData;
};

export function InvitePage({ initialData }: InvitePageProps) {
  const [selectedJob, setSelectedJob] = useState(
    initialData.selectedJobId ?? "",
  );
  const [data, setData] = useState(initialData);
  const [activeCandidate, setActiveCandidate] =
    useState<RecommendedCandidate | null>(null);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [message, setMessage] = useState(defaultInviteMessage);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRecommendations(jobId: string) {
    setSelectedJob(jobId);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ jobId });
      const response = await fetch(`/api/employers/invite?${params}`);
      const payload = (await response.json()) as
        | InvitePageData
        | {
            error?: string;
          };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Could not load recommendations.",
        );
      }

      setData(payload as InvitePageData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load recommendations.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite(candidate: RecommendedCandidate) {
    if (!selectedJob) {
      setError("Select a job before sending an invite.");
      return;
    }

    setSending(true);
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
          message,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not send invite.");
      }

      setSentInvites((currentInvites) => {
        if (currentInvites.includes(candidate.id)) {
          return currentInvites;
        }

        return [...currentInvites, candidate.id];
      });
      setData((currentData) => ({
        ...currentData,
        recommendedCandidates: currentData.recommendedCandidates.map(
          (currentCandidate) =>
            currentCandidate.id === candidate.id
              ? { ...currentCandidate, invited: true }
              : currentCandidate,
        ),
      }));

      setActiveCandidate(null);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Could not send invite.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">
            Invite to apply
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Reach out to recommended candidates and connect directly.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-teal-50 to-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <Sparkles className="h-3 w-3" />
          Skill-ranked
        </div>
      </div>

      <InviteToolbar
        selectedJob={selectedJob}
        onSelectedJobChange={loadRecommendations}
        jobOptions={data.jobs}
        recommendationCount={data.recommendedCandidates.length}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className={loading ? "space-y-2 opacity-60" : "space-y-2"}>
        {data.recommendedCandidates.map((candidate) => (
          <InviteCandidateCard
            key={candidate.id}
            candidate={candidate}
            invited={candidate.invited || sentInvites.includes(candidate.id)}
            onConnect={() => setActiveCandidate(candidate)}
          />
        ))}

        {!loading && data.recommendedCandidates.length === 0 ? (
          <div className="rounded-2xl bg-white px-5 py-10 text-center">
            <h2 className="text-sm font-semibold text-neutral-900">
              No recommendations yet
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Publish a job and make sure candidates have public profiles to
              invite them here.
            </p>
          </div>
        ) : null}
      </div>

      {activeCandidate ? (
        <InviteMessageOverlay
          candidate={activeCandidate}
          message={message}
          onMessageChange={setMessage}
          onClose={() => setActiveCandidate(null)}
          onSendInvite={() => {
            if (!sending) {
              sendInvite(activeCandidate);
            }
          }}
        />
      ) : null}
    </div>
  );
}
