"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { JobSeekerProfile } from "./profile-types";

type SummaryObjectiveSectionProps = {
  profile: JobSeekerProfile;
  onProfileChange: (profile: JobSeekerProfile) => void;
};

type EditableProfileTextField = "executive_summary" | "objective";

type ActiveDialog = {
  field: EditableProfileTextField;
  title: string;
  label: string;
} | null;

const PREVIEW_LIMIT = 230;

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function getPreviewText(value: string | null | undefined, expanded: boolean) {
  const text = normalizeText(value);

  if (expanded || text.length <= PREVIEW_LIMIT) {
    return text;
  }

  return `${text.slice(0, PREVIEW_LIMIT).trim()}...`;
}

function hasLongText(value: string | null | undefined) {
  return normalizeText(value).length > PREVIEW_LIMIT;
}

function TextPreviewCard({
  field,
  value,
  expanded,
  isDeleteRevealed,
  onToggle,
  onEdit,
  onDelete,
  onRevealDelete,
  onHideDelete,
}: {
  field: EditableProfileTextField;
  value: string | null | undefined;
  expanded: boolean;
  isDeleteRevealed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRevealDelete: () => void;
  onHideDelete: () => void;
}) {
  const previewText = getPreviewText(value, expanded);
  const shouldShowToggle = hasLongText(value);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const handlePointerDown = (clientX: number) => {
    setDragStartX(clientX);
  };

  const handlePointerUp = (clientX: number) => {
    if (dragStartX === null) return;

    const deltaX = clientX - dragStartX;

    if (deltaX < -32) {
      onRevealDelete();
    }

    if (deltaX > 32) {
      onHideDelete();
    }

    setDragStartX(null);
  };

  return (
    <div
      className="relative mt-6 overflow-hidden border border-[#f2f2f2] bg-white shadow-soft [border-radius:unset]"
      onPointerDown={(event) => handlePointerDown(event.clientX)}
      onPointerUp={(event) => handlePointerUp(event.clientX)}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`${field.replace("_", " ")} card. Swipe left to reveal delete. Swipe right to hide delete.`}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            onRevealDelete();
          }

          if (event.key === "ArrowRight" || event.key === "Escape") {
            onHideDelete();
          }
        }}
        className="relative bg-white px-4 py-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {previewText}
            </p>

            {shouldShowToggle && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle();
                }}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2 hover:text-primary"
              >
                {expanded ? "Show Less" : "Show More"}
                <ChevronDown
                  aria-hidden="true"
                  className={[
                    "size-4 transition-transform",
                    expanded ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            aria-label={`Edit ${field.replace("_", " ")}`}
            className={[
              "shrink-0 transition-[margin] duration-200 ease-out",
              isDeleteRevealed ? "mr-20" : "mr-0",
            ].join(" ")}
          >
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      <button
        type="button"
        onPointerDown={(event) => handlePointerDown(event.clientX)}
        onPointerUp={(event) => handlePointerUp(event.clientX)}
        onClick={onDelete}
        className={[
          "absolute inset-y-0 right-0 flex w-20 items-center justify-center",
          "border border-[#f2f2f2] bg-white text-foreground",
          "transition-transform duration-200 ease-out hover:bg-[#f7f7f7]",
          isDeleteRevealed ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-label={`Delete ${field.replace("_", " ")}`}
      >
        <Trash2 aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}

export default function SummaryObjectiveSection({
  profile,
  onProfileChange,
}: SummaryObjectiveSectionProps) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [draft, setDraft] = useState("");
  const [initialDraft, setInitialDraft] = useState("");

  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [objectiveExpanded, setObjectiveExpanded] = useState(false);
  const [revealedDeleteField, setRevealedDeleteField] =
    useState<EditableProfileTextField | null>(null);

  const hasExecutiveSummary =
    normalizeText(profile.executive_summary).length > 0;
  const hasObjective = normalizeText(profile.objective).length > 0;

  useEffect(() => {
    if (!activeDialog) return;

    const value = normalizeText(profile[activeDialog.field]);

    setDraft(value);
    setInitialDraft(value);
  }, [activeDialog, profile]);

  const hasChanges = draft.trim() !== initialDraft.trim();

  const openDialog = (
    field: EditableProfileTextField,
    title: string,
    label: string,
  ) => {
    setRevealedDeleteField(null);
    setActiveDialog({
      field,
      title,
      label,
    });
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setDraft("");
    setInitialDraft("");
  };

  const save = () => {
    if (!activeDialog || !hasChanges) return;

    onProfileChange({
      ...profile,
      [activeDialog.field]: draft.trim() || null,
    });

    closeDialog();
  };

  const deleteField = (field: EditableProfileTextField) => {
    setRevealedDeleteField(null);

    onProfileChange({
      ...profile,
      [field]: null,
    });

    if (field === "executive_summary") {
      setSummaryExpanded(false);
    }

    if (field === "objective") {
      setObjectiveExpanded(false);
    }
  };

  return (
    <>
      <section
        className="mx-auto max-w-3xl px-4 py-8"
        aria-labelledby="executive-summary-heading"
      >
        <div
          className={
            hasExecutiveSummary
              ? "flex items-center justify-between gap-4"
              : "flex flex-col items-start gap-6"
          }
        >
          <h2
            id="executive-summary-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Executive summary
          </h2>

          {hasExecutiveSummary ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                openDialog(
                  "executive_summary",
                  "Executive summary",
                  "Executive summary",
                )
              }
              className="rounded-full px-5"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Edit
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                openDialog(
                  "executive_summary",
                  "Executive summary",
                  "Executive summary",
                )
              }
              className="rounded-md px-5 font-semibold"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add Executive Summary
            </Button>
          )}
        </div>

        {hasExecutiveSummary && (
          <TextPreviewCard
            field="executive_summary"
            value={profile.executive_summary}
            expanded={summaryExpanded}
            isDeleteRevealed={revealedDeleteField === "executive_summary"}
            onToggle={() => setSummaryExpanded((current) => !current)}
            onEdit={() =>
              openDialog(
                "executive_summary",
                "Executive summary",
                "Executive summary",
              )
            }
            onDelete={() => deleteField("executive_summary")}
            onRevealDelete={() => setRevealedDeleteField("executive_summary")}
            onHideDelete={() => setRevealedDeleteField(null)}
          />
        )}
      </section>

      <section
        className="mx-auto max-w-3xl px-4 py-8"
        aria-labelledby="objective-heading"
      >
        <div
          className={
            hasObjective
              ? "flex items-center justify-between gap-4"
              : "flex flex-col items-start gap-6"
          }
        >
          <h2
            id="objective-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Objective
          </h2>

          {hasObjective ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => openDialog("objective", "Objective", "Objective")}
              className="rounded-full px-5"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Edit
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => openDialog("objective", "Objective", "Objective")}
              className="rounded-md px-5 font-semibold"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add Objective
            </Button>
          )}
        </div>

        {hasObjective && (
          <TextPreviewCard
            field="objective"
            value={profile.objective}
            expanded={objectiveExpanded}
            isDeleteRevealed={revealedDeleteField === "objective"}
            onToggle={() => setObjectiveExpanded((current) => !current)}
            onEdit={() => openDialog("objective", "Objective", "Objective")}
            onDelete={() => deleteField("objective")}
            onRevealDelete={() => setRevealedDeleteField("objective")}
            onHideDelete={() => setRevealedDeleteField(null)}
          />
        )}
      </section>

      <Dialog
        open={Boolean(activeDialog)}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-h-[84vh] max-w-md overflow-y-auto rounded-xl border border-border bg-background p-0 shadow-2xl">
          <div className="px-6 pb-3 pt-6">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {activeDialog?.title}
            </DialogTitle>
          </div>

          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="summaryObjectiveText">
                {activeDialog?.label}
              </Label>

              <div className="rounded-md border border-input">
                <div
                  className="flex items-center gap-6 border-b border-border px-4 py-2 text-foreground"
                  aria-hidden="true"
                >
                  <span className="text-lg leading-none">≡</span>
                  <span className="text-lg leading-none">≣</span>
                </div>

                <textarea
                  id="summaryObjectiveText"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="min-h-40 w-full resize-y border-0 bg-background px-3 py-3 text-sm leading-6 outline-none focus-visible:ring-0"
                />
              </div>

              <p className="text-xs text-muted-foreground">Optional</p>
            </div>

            <Button
              type="button"
              className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={save}
              disabled={!hasChanges}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
