// src/job-seekers/profile/LinksSection.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, LinkIcon, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileLink } from "./profile-types";
import { createLocalId } from "./profile-utils";

type LinksSectionProps = {
  items: ProfileLink[];
  onChange: (items: ProfileLink[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const WEBSITE_LABEL = "Professional Website";
const LINKEDIN_LABEL = "LinkedIn Profile";

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getLinkByLabel(items: ProfileLink[], label: string) {
  return items.find(
    (item) => item.label.trim().toLowerCase() === label.toLowerCase(),
  );
}

function isValidOptionalUrl(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(normalizeUrl(value));

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function LinkedInMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-4 place-items-center rounded-[3px] bg-foreground text-[8px] font-bold leading-none text-background"
    >
      in
    </span>
  );
}

export default function LinksSection({
  items,
  onChange,
  open,
  onOpenChange,
}: LinksSectionProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = typeof open === "boolean";
  const dialogOpen = isControlled ? open : internalOpen;

  const setDialogOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
      return;
    }

    setInternalOpen(value);
  };

  const websiteLink = useMemo(
    () => getLinkByLabel(items, WEBSITE_LABEL),
    [items],
  );

  const linkedinLink = useMemo(
    () => getLinkByLabel(items, LINKEDIN_LABEL),
    [items],
  );

  const hasLinks = Boolean(websiteLink?.url || linkedinLink?.url);

  const [professionalWebsite, setProfessionalWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [initialProfessionalWebsite, setInitialProfessionalWebsite] =
    useState("");
  const [initialLinkedin, setInitialLinkedin] = useState("");
  const [errors, setErrors] = useState<{
    professionalWebsite?: string;
    linkedin?: string;
  }>({});

  const [revealedDeleteId, setRevealedDeleteId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  useEffect(() => {
    if (!dialogOpen) return;

    const currentWebsite = websiteLink?.url ?? "";
    const currentLinkedin = linkedinLink?.url ?? "";

    setProfessionalWebsite(currentWebsite);
    setLinkedin(currentLinkedin);
    setInitialProfessionalWebsite(currentWebsite);
    setInitialLinkedin(currentLinkedin);
    setErrors({});
  }, [dialogOpen, websiteLink?.url, linkedinLink?.url]);

  const hasChanges =
    professionalWebsite.trim() !== initialProfessionalWebsite.trim() ||
    linkedin.trim() !== initialLinkedin.trim();

  const canSave =
    hasChanges &&
    isValidOptionalUrl(professionalWebsite) &&
    isValidOptionalUrl(linkedin);

  const save = () => {
    const nextErrors: typeof errors = {};

    if (!isValidOptionalUrl(professionalWebsite)) {
      nextErrors.professionalWebsite = "Enter a valid website URL.";
    }

    if (!isValidOptionalUrl(linkedin)) {
      nextErrors.linkedin = "Enter a valid LinkedIn URL.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const otherLinks = items.filter((item) => {
      const label = item.label.trim().toLowerCase();

      return (
        label !== WEBSITE_LABEL.toLowerCase() &&
        label !== LINKEDIN_LABEL.toLowerCase()
      );
    });

    const nextLinks: ProfileLink[] = [...otherLinks];

    if (professionalWebsite.trim()) {
      nextLinks.push({
        id: websiteLink?.id ?? createLocalId("link"),
        label: WEBSITE_LABEL,
        url: normalizeUrl(professionalWebsite),
      });
    }

    if (linkedin.trim()) {
      nextLinks.push({
        id: linkedinLink?.id ?? createLocalId("link"),
        label: LINKEDIN_LABEL,
        url: normalizeUrl(linkedin),
      });
    }

    onChange(nextLinks);
    setDialogOpen(false);
  };

  const removeLink = (id: string) => {
    setRevealedDeleteId(null);
    onChange(items.filter((item) => item.id !== id));
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

  const renderLinkCard = (
    link: ProfileLink,
    icon: React.ReactNode,
    ariaLabel: string,
  ) => {
    const isDeleteRevealed = revealedDeleteId === link.id;

    return (
      <li
        key={link.id}
        className="relative overflow-hidden border border-[#f2f2f2] bg-white shadow-soft [border-radius:unset]"
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={`${ariaLabel}. Swipe left to reveal delete. Swipe right to hide delete.`}
          onPointerDown={(event) => handlePointerDown(event.clientX)}
          onPointerUp={(event) => handlePointerUp(link.id, event.clientX)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              setRevealedDeleteId(link.id);
            }

            if (event.key === "ArrowRight" || event.key === "Escape") {
              setRevealedDeleteId(null);
            }
          }}
          className="relative bg-white px-4 py-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon}

              <p className="text-sm font-semibold">{link.label}</p>
            </div>

            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate text-sm text-foreground hover:text-primary hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="truncate">{link.url}</span>
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={() => removeLink(link.id)}
          className={[
            "absolute inset-y-0 right-0 flex w-20 items-center justify-center",
            "border border-[#f2f2f2] bg-white text-foreground",
            "transition-transform duration-200 ease-out hover:bg-[#f7f7f7]",
            isDeleteRevealed ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
          aria-label={`Delete ${ariaLabel}`}
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </button>
      </li>
    );
  };

  return (
    <>
      {hasLinks && (
        <section
          className="mx-auto max-w-3xl px-4 py-8"
          aria-labelledby="links-heading"
        >
          <div className="flex items-center justify-between gap-4">
            <h2
              id="links-heading"
              className="text-2xl font-bold tracking-tight"
            >
              Links
            </h2>

            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(true)}
              className="rounded-full px-5"
            >
              <Pencil aria-hidden="true" className="size-4" />
              Edit
            </Button>
          </div>

          <ul className="mt-6 space-y-5" aria-label="Profile links">
            {websiteLink?.url &&
              renderLinkCard(
                websiteLink,
                <LinkIcon aria-hidden="true" className="size-4" />,
                "professional website",
              )}

            {linkedinLink?.url &&
              renderLinkCard(
                linkedinLink,
                <LinkedInMark />,
                "LinkedIn profile",
              )}
          </ul>
        </section>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border border-border bg-background p-0 shadow-2xl">
          <div className="px-7 pb-4 pt-7">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Links
            </DialogTitle>
          </div>

          <div className="space-y-5 px-7 pb-7">
            <div className="space-y-2">
              <Label htmlFor="professionalWebsite">Professional Website</Label>

              <Input
                id="professionalWebsite"
                value={professionalWebsite}
                onChange={(event) => {
                  setProfessionalWebsite(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    professionalWebsite: undefined,
                  }));
                }}
                placeholder="https://example.com"
                autoComplete="url"
                aria-invalid={Boolean(errors.professionalWebsite)}
                aria-describedby={
                  errors.professionalWebsite
                    ? "professionalWebsite-error"
                    : undefined
                }
              />

              {errors.professionalWebsite && (
                <p
                  id="professionalWebsite-error"
                  className="text-sm text-destructive"
                >
                  {errors.professionalWebsite}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>

              <Input
                id="linkedin"
                value={linkedin}
                onChange={(event) => {
                  setLinkedin(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    linkedin: undefined,
                  }));
                }}
                placeholder="https://linkedin.com/in/yourprofile"
                autoComplete="url"
                aria-invalid={Boolean(errors.linkedin)}
                aria-describedby={
                  errors.linkedin ? "linkedin-error" : undefined
                }
              />

              {errors.linkedin && (
                <p id="linkedin-error" className="text-sm text-destructive">
                  {errors.linkedin}
                </p>
              )}
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
    </>
  );
}
