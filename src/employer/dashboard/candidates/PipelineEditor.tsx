"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import type { CandidatePipelineStage } from "./candidates-content";

type PipelineEditorProps = {
  stages: CandidatePipelineStage[];
  onSaved: (stages: CandidatePipelineStage[]) => void;
};

export function PipelineEditor({ stages, onSaved }: PipelineEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(stages);
  const [saving, setSaving] = useState(false);

  const updateOrder = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next.map((stage, position) => ({ ...stage, position })));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/employers/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stages: draft.map((stage, position) => ({ ...stage, position })),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(body?.error ?? "Could not save pipeline.");
      onSaved(body.stages);
      setDraft(body.stages);
      setOpen(false);
      toast.success("Candidate pipeline saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save pipeline.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(stages);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium"
      >
        <Settings2 className="size-4" /> Configure pipeline
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Candidate pipeline</h2>
          <p className="text-sm text-neutral-500">Use 2–12 reusable stages.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-neutral-500"
        >
          Cancel
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {draft.map((stage, index) => (
          <div
            key={stage.id ?? `new-${index}`}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              value={stage.name}
              maxLength={60}
              onChange={(event) =>
                setDraft((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                )
              }
              aria-label={`Stage ${index + 1} name`}
              className="min-w-48 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <select
              value={stage.applicationStatus}
              onChange={(event) =>
                setDraft((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? {
                          ...item,
                          applicationStatus: event.target
                            .value as CandidatePipelineStage["applicationStatus"],
                        }
                      : item,
                  ),
                )
              }
              aria-label={`Stage ${index + 1} outcome`}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="reviewing">Reviewing</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Not selected</option>
            </select>
            <button
              type="button"
              aria-label="Move stage up"
              onClick={() => updateOrder(index, -1)}
              disabled={index === 0}
              className="rounded p-2 disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Move stage down"
              onClick={() => updateOrder(index, 1)}
              disabled={index === draft.length - 1}
              className="rounded p-2 disabled:opacity-30"
            >
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Remove stage"
              onClick={() =>
                setDraft((current) =>
                  current
                    .filter((_, itemIndex) => itemIndex !== index)
                    .map((item, position) => ({ ...item, position })),
                )
              }
              disabled={draft.length <= 2}
              className="rounded p-2 text-rose-600 disabled:opacity-30"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          disabled={draft.length >= 12}
          onClick={() =>
            setDraft((current) => [
              ...current,
              {
                id: null,
                name: "New stage",
                position: current.length,
                applicationStatus: "reviewing",
              },
            ])
          }
          className="inline-flex items-center gap-2 text-sm font-medium disabled:opacity-40"
        >
          <Plus className="size-4" /> Add stage
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}{" "}
          Save pipeline
        </button>
      </div>
    </section>
  );
}
