"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Criterion = { name: string; rating: number; note: string };
type Scorecard = {
  id: string;
  reviewer_id: string;
  interview_round: string;
  recommendation: string;
  overall_rating: number;
  summary: string | null;
  submitted_at: string;
};

const defaultCriteria: Criterion[] = [
  { name: "Role expertise", rating: 3, note: "" },
  { name: "Problem solving", rating: 3, note: "" },
  { name: "Communication", rating: 3, note: "" },
];

export function ScorecardPanel({ applicationId }: { applicationId: string }) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [round, setRound] = useState("Interview");
  const [recommendation, setRecommendation] = useState("mixed");
  const [overallRating, setOverallRating] = useState(3);
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [summary, setSummary] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/employers/applications/${applicationId}/scorecards`,
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setScorecards(body.scorecards);
      setAverageRating(body.averageRating);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load scorecards.",
      );
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/employers/applications/${applicationId}/scorecards`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewRound: round,
            recommendation,
            overallRating,
            criteria,
            summary: summary || null,
          }),
        },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(body?.error ?? "Could not save scorecard.");
      toast.success("Interview scorecard saved.");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save scorecard.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <Loader2 className="size-5 animate-spin text-neutral-400" />;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white p-3 text-sm">
        <span className="font-semibold">Team feedback:</span>{" "}
        {scorecards.length
          ? `${scorecards.length} scorecard${scorecards.length === 1 ? "" : "s"} · ${averageRating?.toFixed(1)}/5 average`
          : "No scorecards yet"}
      </div>
      {scorecards.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2">
          {scorecards.map((scorecard) => (
            <div
              key={scorecard.id}
              className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"
            >
              <div className="flex justify-between gap-2">
                <strong>{scorecard.interview_round}</strong>
                <span>{scorecard.overall_rating}/5</span>
              </div>
              <p className="mt-1 capitalize text-neutral-500">
                {scorecard.recommendation.replace("_", " ")}
              </p>
              {scorecard.summary ? (
                <p className="mt-2 text-neutral-600">{scorecard.summary}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={round}
          maxLength={80}
          onChange={(event) => setRound(event.target.value)}
          aria-label="Interview round"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        />
        <select
          value={recommendation}
          onChange={(event) => setRecommendation(event.target.value)}
          aria-label="Recommendation"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        >
          <option value="strong_yes">Strong yes</option>
          <option value="yes">Yes</option>
          <option value="mixed">Mixed</option>
          <option value="no">No</option>
          <option value="strong_no">Strong no</option>
        </select>
        <select
          value={overallRating}
          onChange={(event) => setOverallRating(Number(event.target.value))}
          aria-label="Overall rating"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        >
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={rating} value={rating}>
              {rating}/5 overall
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        {criteria.map((criterion, index) => (
          <div
            key={`${criterion.name}-${index}`}
            className="grid gap-2 md:grid-cols-[1fr_120px_2fr_auto]"
          >
            <input
              value={criterion.name}
              maxLength={80}
              onChange={(event) =>
                setCriteria((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                )
              }
              aria-label={`Criterion ${index + 1}`}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
            <select
              value={criterion.rating}
              onChange={(event) =>
                setCriteria((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, rating: Number(event.target.value) }
                      : item,
                  ),
                )
              }
              aria-label={`${criterion.name} rating`}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating}>{rating}</option>
              ))}
            </select>
            <input
              value={criterion.note}
              maxLength={1000}
              onChange={(event) =>
                setCriteria((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, note: event.target.value }
                      : item,
                  ),
                )
              }
              placeholder="Evidence or notes"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={criteria.length === 1}
              onClick={() =>
                setCriteria((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
              aria-label="Remove criterion"
              className="p-2 text-rose-600 disabled:opacity-30"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={criteria.length >= 12}
        onClick={() =>
          setCriteria((current) => [
            ...current,
            { name: "New criterion", rating: 3, note: "" },
          ])
        }
        className="inline-flex items-center gap-1 text-sm font-medium"
      >
        <Plus className="size-4" /> Add criterion
      </button>
      <textarea
        value={summary}
        maxLength={3000}
        onChange={(event) => setSummary(event.target.value)}
        placeholder="Overall private team summary"
        className="min-h-24 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
      />
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}{" "}
          Save scorecard
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        Scorecards are private to authorized company teammates and never shown
        to candidates.
      </p>
    </div>
  );
}
