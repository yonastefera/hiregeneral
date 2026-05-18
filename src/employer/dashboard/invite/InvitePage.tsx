"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { InviteCandidateCard } from "./InviteCandidateCard";
import { InviteMessageOverlay } from "./InviteMessageOverlay";
import { InviteToolbar } from "./InviteToolbar";
import {
  defaultInviteMessage,
  inviteJobOptions,
  recommendedCandidates,
  type RecommendedCandidate,
} from "./invite-content";

export function InvitePage() {
  const [selectedJob, setSelectedJob] = useState("Senior Product Designer");
  const [activeCandidate, setActiveCandidate] =
    useState<RecommendedCandidate | null>(null);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [message, setMessage] = useState(defaultInviteMessage);

  function sendInvite(candidate: RecommendedCandidate) {
    setSentInvites((currentInvites) => {
      if (currentInvites.includes(candidate.name)) {
        return currentInvites;
      }

      return [...currentInvites, candidate.name];
    });

    setActiveCandidate(null);
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
          AI-matched
        </div>
      </div>

      <InviteToolbar
        selectedJob={selectedJob}
        onSelectedJobChange={setSelectedJob}
        jobOptions={inviteJobOptions}
        recommendationCount={recommendedCandidates.length}
      />

      <div className="space-y-2">
        {recommendedCandidates.map((candidate) => (
          <InviteCandidateCard
            key={candidate.name}
            candidate={candidate}
            invited={sentInvites.includes(candidate.name)}
            onConnect={() => setActiveCandidate(candidate)}
          />
        ))}
      </div>

      {activeCandidate ? (
        <InviteMessageOverlay
          candidate={activeCandidate}
          message={message}
          onMessageChange={setMessage}
          onClose={() => setActiveCandidate(null)}
          onSendInvite={() => sendInvite(activeCandidate)}
        />
      ) : null}
    </div>
  );
}
