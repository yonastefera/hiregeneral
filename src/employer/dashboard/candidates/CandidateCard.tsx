"use client";

import { useState } from "react";
import { Briefcase, Loader2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

import type {
  Candidate,
  CandidatePipelineStage,
  CandidateStatus,
} from "./candidates-content";
import { ScorecardPanel } from "./ScorecardPanel";

type CandidateCardProps = {
  candidate: Candidate;
  pipelineStages: CandidatePipelineStage[];
  onStatusChanged: (status: CandidateStatus, stageId: string) => void;
};

const statusClassNames: Record<CandidateStatus, string> = {
  submitted: "bg-emerald-50 text-emerald-700",
  reviewing: "bg-amber-50 text-amber-700",
  interview: "bg-violet-50 text-violet-700",
  offer: "bg-teal-50 text-teal-700",
  rejected: "bg-rose-50 text-rose-700",
};

const statusLabels: Record<CandidateStatus, string> = {
  submitted: "New",
  reviewing: "Reviewing",
  interview: "Interview",
  offer: "Offer",
  rejected: "Not selected",
};

export function CandidateCard({
  candidate,
  pipelineStages,
  onStatusChanged,
}: CandidateCardProps) {
  const initialStageId =
    candidate.pipelineStageId ??
    pipelineStages.find((stage) => stage.applicationStatus === candidate.status)
      ?.id ??
    "";
  const [stageId, setStageId] = useState(initialStageId);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const stageLabel =
    pipelineStages.find((stage) => stage.id === candidate.pipelineStageId)
      ?.name ?? statusLabels[candidate.status];
  const initials = candidate.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("");

  const saveStatus = async () => {
    if (!stageId) return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/employers/applications/${candidate.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageId, note: note.trim() || null }),
        },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(body?.error ?? "Could not update application.");
      const selectedStage = pipelineStages.find(
        (stage) => stage.id === stageId,
      );
      if (!selectedStage) throw new Error("Choose a valid pipeline stage.");
      onStatusChanged(selectedStage.applicationStatus, stageId);
      setNote("");
      setEditing(false);
      toast.success("Candidate status updated.");
    } catch (error) {
      setStageId(initialStageId);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update application.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 transition-colors hover:bg-white/80">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 text-[12px] font-semibold text-white">
          {initials}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold">{candidate.name}</h2>

            {candidate.match ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-teal-50 to-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                <Star className="h-2.5 w-2.5" />
                {candidate.match}% match
              </span>
            ) : null}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
            <span>{candidate.role}</span>

            <span className="inline-flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {candidate.location}
            </span>

            <span>{candidate.experience}</span>

            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-2.5 w-2.5" />
              {candidate.job}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-neutral-400">
            Applied
          </div>
          <div className="text-[12px] font-medium">{candidate.applied}</div>
        </div>

        <button
          type="button"
          onClick={() =>
            pipelineStages.length > 0 && setEditing((current) => !current)
          }
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
            statusClassNames[candidate.status]
          }`}
        >
          {stageLabel}
        </button>

        {candidate.resumeUrl ? (
          <a
            href={candidate.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-neutral-100 px-3.5 py-2 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-200/60"
          >
            Resume
          </a>
        ) : (
          <button
            type="button"
            className="rounded-lg bg-neutral-100 px-3.5 py-2 text-[12px] font-medium text-neutral-700 transition hover:bg-neutral-200/60"
          >
            View
          </button>
        )}
        <button
          type="button"
          onClick={() => setScorecardOpen((current) => !current)}
          className="rounded-lg bg-neutral-900 px-3.5 py-2 text-[12px] font-semibold text-white"
        >
          Scorecard
        </button>
      </div>

      {editing ? (
        <div className="basis-full rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={stageId}
              onChange={(event) => setStageId(event.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
              aria-label="Candidate status"
            >
              <option value="" disabled>
                Choose a stage
              </option>
              {pipelineStages.map((stage) =>
                stage.id ? (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ) : null,
              )}
            </select>
            <input
              value={note}
              maxLength={1000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional response visible to the candidate"
              className="min-w-64 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={saving}
              onClick={saveStatus}
              className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Update
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Status changes and this response appear in the candidate&apos;s
            timeline.
          </p>
        </div>
      ) : null}

      {scorecardOpen ? (
        <div className="basis-full rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <ScorecardPanel applicationId={candidate.id} />
        </div>
      ) : null}
    </article>
  );
}
