"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LicenseCertification } from "./profile-types";
import { createLocalId } from "./profile-utils";

type LicensesCertificationsSectionProps = {
  items: LicenseCertification[];
  onChange: (items: LicenseCertification[]) => void;
};

type LicenseDraft = LicenseCertification & {
  organization?: string | null;
  description?: string | null;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getLicenseOrganization(item: LicenseCertification) {
  const record = item as unknown as Record<string, unknown>;

  return (
    normalizeText(record.organization) ||
    normalizeText(record.issuer) ||
    normalizeText(record.issuing_organization) ||
    normalizeText(record.issuingOrganization)
  );
}

function getLicenseDescription(item: LicenseCertification) {
  const record = item as unknown as Record<string, unknown>;

  return normalizeText(record.description);
}

function createEmptyLicense(): LicenseDraft {
  return {
    id: createLocalId("license"),
    name: "",
    organization: "",
    issue_year: "",
    description: "",
  } as LicenseDraft;
}

function toStoredLicense(draft: LicenseDraft): LicenseCertification {
  return {
    ...draft,
    name: normalizeText(draft.name),
    organization: normalizeText(draft.organization) || null,
    issue_year: normalizeText(draft.issue_year) || null,
    description: normalizeText(draft.description) || null,
  } as LicenseCertification;
}

export default function LicensesCertificationsSection({
  items,
  onChange,
}: LicensesCertificationsSectionProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LicenseDraft>(createEmptyLicense());

  const [revealedDeleteId, setRevealedDeleteId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const editingItem = useMemo(
    () => safeItems.find((item) => item.id === editingId) ?? null,
    [editingId, safeItems],
  );

  useEffect(() => {
    if (!open) return;

    if (editingItem) {
      setDraft({
        ...editingItem,
        organization: getLicenseOrganization(editingItem),
        description: getLicenseDescription(editingItem),
      } as LicenseDraft);
      return;
    }

    setDraft(createEmptyLicense());
  }, [editingItem, open]);

  const canSave = normalizeText(draft.name).length > 0;

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

  const openAddDialog = () => {
    setEditingId(null);
    setRevealedDeleteId(null);
    setDraft(createEmptyLicense());
    setOpen(true);
  };

  const openEditDialog = (item: LicenseCertification) => {
    setEditingId(item.id);
    setRevealedDeleteId(null);
    setDraft({
      ...item,
      organization: getLicenseOrganization(item),
      description: getLicenseDescription(item),
    } as LicenseDraft);
    setOpen(true);
  };

  const saveLicense = () => {
    if (!canSave) return;

    const storedLicense = toStoredLicense(draft);

    if (editingId) {
      onChange(
        safeItems.map((item) => (item.id === editingId ? storedLicense : item)),
      );
    } else {
      onChange([...safeItems, storedLicense]);
    }

    setOpen(false);
    setEditingId(null);
    setDraft(createEmptyLicense());
  };

  const deleteLicense = (id: string) => {
    setRevealedDeleteId(null);
    onChange(safeItems.filter((item) => item.id !== id));
  };

  return (
    <>
      <section
        className="mx-auto max-w-3xl px-4 py-8"
        aria-labelledby="licenses-heading"
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2
            id="licenses-heading"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Licenses and certificates
          </h2>

          <Button
            type="button"
            variant="outline"
            onClick={openAddDialog}
            className="border border-[#f2f2f2] bg-white px-5 shadow-none [border-radius:999px]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add
          </Button>
        </div>

        {safeItems.length > 0 ? (
          <div className="space-y-4">
            {safeItems.map((item) => {
              const organization = getLicenseOrganization(item);
              const description = getLicenseDescription(item);
              const isDeleteRevealed = revealedDeleteId === item.id;

              return (
                <article
                  key={item.id}
                  className="relative overflow-hidden border border-[#f2f2f2] bg-white shadow-none [border-radius:3px]"
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
                    className="relative bg-white p-6 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <div className="flex gap-4">
                      <div className="mt-1 shrink-0 text-foreground">
                        <Award aria-hidden="true" className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1 pr-14">
                        <h3 className="font-semibold text-foreground">
                          {item.name || "License or certificate"}
                        </h3>

                        {organization && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {organization}
                          </p>
                        )}

                        {item.issue_year && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {item.issue_year}
                          </p>
                        )}

                        {description && (
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {description}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditDialog(item);
                        }}
                        className={[
                          "shrink-0 transition-[margin] duration-200 ease-out",
                          isDeleteRevealed ? "mr-20" : "mr-0",
                        ].join(" ")}
                        aria-label="Edit license or certificate"
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
                    onClick={() => deleteLicense(item.id)}
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
                </article>
              );
            })}
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={openAddDialog}
            className="border border-[#f2f2f2] bg-white px-5 shadow-none [border-radius:3px]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add License/Certificate
          </Button>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[86vh] max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-0 shadow-2xl">
          <div className="border-b border-border px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  Licenses and certificates
                </DialogTitle>

                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  Add certifications, licenses, awards, or credentials relevant
                  to your work.
                </DialogDescription>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="size-9 shrink-0"
                aria-label="Close dialog"
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="licenseName">Name *</Label>
              <Input
                id="licenseName"
                value={draft.name ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    name: event.target.value,
                  })
                }
                placeholder="Example: AWS Solutions Architect"
                className="h-12"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="licenseOrganization">Issuing organization</Label>
              <Input
                id="licenseOrganization"
                value={draft.organization ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    organization: event.target.value,
                  })
                }
                placeholder="Example: Amazon Web Services"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="licenseIssueYear">Issue year</Label>
              <Input
                id="licenseIssueYear"
                value={draft.issue_year ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    issue_year: event.target.value,
                  })
                }
                placeholder="Example: 2024"
                inputMode="numeric"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="licenseDescription">Description</Label>
              <textarea
                id="licenseDescription"
                value={draft.description ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    description: event.target.value,
                  })
                }
                placeholder="Briefly describe this credential"
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-border bg-background px-6 py-5">
            <Button
              type="button"
              className="w-full bg-[#087f73] text-white hover:bg-[#066d63] disabled:bg-[#087f73]/40"
              size="lg"
              onClick={saveLicense}
              disabled={!canSave}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
