"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LicenseCertification } from "./profile-types";
import { createLocalId } from "./profile-utils";

type LicensesCertificationsSectionProps = {
  items: LicenseCertification[];
  onChange: (items: LicenseCertification[]) => void;
};

const EMPTY_VALUE = "__empty__";

const emptyCertification = (): LicenseCertification => ({
  id: createLocalId("certification"),
  name: "",
  issuer: "",
  issue_year: null,
  description: "",
});

function normalizeSelectValue(value: string | null | undefined) {
  return value?.trim() ? value : EMPTY_VALUE;
}

function denormalizeSelectValue(value: string) {
  return value === EMPTY_VALUE ? null : value;
}

function getYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 70 }, (_, index) => {
    const year = String(currentYear + 1 - index);

    return {
      value: year,
      label: year,
    };
  });
}

export default function LicensesCertificationsSection({
  items,
  onChange,
}: LicensesCertificationsSectionProps) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LicenseCertification | null>(
    null,
  );
  const [draft, setDraft] =
    useState<LicenseCertification>(emptyCertification());
  const [initialDraft, setInitialDraft] =
    useState<LicenseCertification>(emptyCertification());

  const [revealedDeleteId, setRevealedDeleteId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const yearOptions = useMemo(() => getYearOptions(), []);

  useEffect(() => {
    if (!open) return;

    const nextDraft = editingItem ?? emptyCertification();

    setDraft(nextDraft);
    setInitialDraft(nextDraft);
  }, [open, editingItem]);

  const hasChanges =
    draft.name.trim() !== initialDraft.name.trim() ||
    draft.issuer.trim() !== initialDraft.issuer.trim() ||
    (draft.issue_year ?? "") !== (initialDraft.issue_year ?? "") ||
    draft.description.trim() !== initialDraft.description.trim();

  const canSave = hasChanges && draft.name.trim().length > 0;

  const openAdd = () => {
    setEditingItem(null);
    setRevealedDeleteId(null);
    setOpen(true);
  };

  const openEdit = (item: LicenseCertification) => {
    setRevealedDeleteId(null);
    setEditingItem(item);
    setOpen(true);
  };

  const removeItem = (id: string) => {
    setRevealedDeleteId(null);
    onChange(items.filter((item) => item.id !== id));
  };

  const save = () => {
    if (!canSave) return;

    const nextDraft: LicenseCertification = {
      ...draft,
      name: draft.name.trim(),
      issuer: draft.issuer.trim(),
      issue_year: draft.issue_year,
      description: draft.description.trim(),
    };

    const exists = items.some((item) => item.id === nextDraft.id);

    if (exists) {
      onChange(
        items.map((item) => (item.id === nextDraft.id ? nextDraft : item)),
      );
    } else {
      onChange([nextDraft, ...items]);
    }

    setEditingItem(null);
    setOpen(false);
  };

  const handlePointerDown = (clientX: number) => {
    setDragStartX(clientX);
  };

  const handlePointerUp = (itemId: string, clientX: number) => {
    if (dragStartX === null) return;

    const deltaX = clientX - dragStartX;

    if (deltaX < -32) {
      setRevealedDeleteId(itemId);
    }

    if (deltaX > 32) {
      setRevealedDeleteId(null);
    }

    setDragStartX(null);
  };

  return (
    <section
      className="mx-auto max-w-3xl px-4 py-8"
      aria-labelledby="licenses-heading"
    >
      <div className="flex flex-col items-start gap-6">
        <h2 id="licenses-heading" className="text-2xl font-bold tracking-tight">
          Licenses and certificates
        </h2>

        {items.length === 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={openAdd}
            className="rounded-md px-5 font-semibold"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add License/Certificate
          </Button>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={openAdd}
              className="rounded-full px-5"
            >
              <Plus aria-hidden="true" className="size-4" />
              Add
            </Button>
          </div>

          <ul className="mt-6 space-y-5" aria-label="Licenses and certificates">
            {items.map((item) => {
              const isDeleteRevealed = revealedDeleteId === item.id;

              return (
                <li
                  key={item.id}
                  className="relative overflow-hidden border border-[#f2f2f2] bg-white shadow-soft [border-radius:unset]"
                  onPointerDown={(event) => handlePointerDown(event.clientX)}
                  onPointerUp={(event) =>
                    handlePointerUp(item.id, event.clientX)
                  }
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`${
                      item.name || "License or certificate"
                    } card. Swipe left to reveal delete. Swipe right to hide delete.`}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowLeft") {
                        setRevealedDeleteId(item.id);
                      }

                      if (
                        event.key === "ArrowRight" ||
                        event.key === "Escape"
                      ) {
                        setRevealedDeleteId(null);
                      }
                    }}
                    className="relative bg-white px-4 py-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Award
                          aria-hidden="true"
                          className="size-4 shrink-0 text-foreground"
                        />

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold">
                            {item.name || "License or certificate"}
                          </h3>

                          {item.issuer && (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {item.issuer}
                            </p>
                          )}

                          {item.issue_year && (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              {item.issue_year}
                            </p>
                          )}

                          {item.description && (
                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(item);
                        }}
                        aria-label={`Edit ${
                          item.name || "license or certificate"
                        }`}
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
                    onPointerUp={(event) =>
                      handlePointerUp(item.id, event.clientX)
                    }
                    onClick={() => removeItem(item.id)}
                    className={[
                      "absolute inset-y-0 right-0 flex w-20 items-center justify-center",
                      "border border-[#f2f2f2] bg-white text-foreground",
                      "transition-transform duration-200 ease-out hover:bg-[#f7f7f7]",
                      isDeleteRevealed ? "translate-x-0" : "translate-x-full",
                    ].join(" ")}
                    aria-label={`Delete ${
                      item.name || "license or certificate"
                    }`}
                  >
                    <Trash2 aria-hidden="true" className="size-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-md overflow-y-auto rounded-xl border border-border bg-background p-0 shadow-2xl">
          <div className="px-6 pb-3 pt-6">
            <DialogTitle className="text-xl font-bold tracking-tight">
              Licenses and certificates
            </DialogTitle>
          </div>

          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="licenseName">
                License or certificate<span aria-hidden="true">*</span>
              </Label>

              <Input
                id="licenseName"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuer">Issuing organization</Label>

              <Input
                id="issuer"
                value={draft.issuer}
                onChange={(event) =>
                  setDraft({ ...draft, issuer: event.target.value })
                }
              />

              <p className="text-sm text-muted-foreground">Optional</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueYear">Issue year</Label>

              <Select
                value={normalizeSelectValue(draft.issue_year)}
                onValueChange={(value) =>
                  setDraft({
                    ...draft,
                    issue_year: denormalizeSelectValue(value),
                  })
                }
              >
                <SelectTrigger id="issueYear">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}>Not specified</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-sm text-muted-foreground">Optional</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseDescription">Description</Label>

              <div className="rounded-md border border-input">
                <div
                  className="flex items-center gap-6 border-b border-border px-4 py-2 text-foreground"
                  aria-hidden="true"
                >
                  <span className="text-lg leading-none">≡</span>
                  <span className="text-lg leading-none">≣</span>
                </div>

                <textarea
                  id="licenseDescription"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  className="min-h-28 w-full resize-y border-0 bg-background px-3 py-3 text-sm outline-none focus-visible:ring-0"
                />
              </div>

              <p className="text-sm text-muted-foreground">Optional</p>
            </div>

            <Button
              type="button"
              className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={save}
              disabled={!canSave}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
