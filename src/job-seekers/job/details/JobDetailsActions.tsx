"use client";

import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bookmark,
  ExternalLink,
  Loader2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSavedJobs } from "@/hooks/useSavedJobs";

type JobDetailsActionsProps = {
  jobId: string;
  slug?: string | null;
  companyName: string;
  title: string;
  applyUrl?: string | null;
  variant?: "hero" | "cta";
};

export default function JobDetailsActions({
  jobId,
  slug,
  companyName,
  title,
  applyUrl,
  variant = "hero",
}: JobDetailsActionsProps) {
  const router = useRouter();
  const { isSaved, toggleSaved, pendingId } = useSavedJobs();

  const saved = isSaved(jobId);
  const saving = pendingId === jobId;
  const isExternal = Boolean(applyUrl);
  const detailsPath = `/job/${slug ?? jobId}`;

  const onApply = () => {
    if (isExternal && applyUrl) {
      window.open(applyUrl, "_blank", "noopener,noreferrer");
      toast.success(`Opening ${companyName} careers page in a new tab.`);
      return;
    }

    router.push(`${detailsPath}/apply`);
  };

  const onSave = async () => {
    if (saving) return;

    const nowSaved = await toggleSaved(jobId);
    toast.info(nowSaved ? "Saved to your jobs." : "Removed from saved jobs.");
  };

  const onShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} — ${companyName}`,
          url,
        });
        return;
      } catch {
        // Share cancelled.
      }
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard.");
  };

  if (variant === "cta") {
    return (
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="warm" size="lg" onClick={onApply}>
          {isExternal ? (
            <>
              Apply on {companyName}
              <ExternalLink aria-hidden="true" className="size-4" />
            </>
          ) : (
            <>
              Apply now
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </>
          )}
        </Button>

        <Button
          variant={saved ? "warm" : "glass"}
          size="lg"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Bookmark
              aria-hidden="true"
              className={saved ? "fill-current" : ""}
            />
          )}
          {saving ? "Saving…" : saved ? "Saved" : "Save for later"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="hero" size="lg" onClick={onApply}>
        {isExternal ? (
          <>
            Apply on {companyName}
            <ExternalLink aria-hidden="true" className="size-4" />
          </>
        ) : (
          <>
            Apply now
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </>
        )}
      </Button>

      <button
        type="button"
        aria-label={saved ? "Remove saved job" : "Save job"}
        aria-pressed={saved}
        onClick={onSave}
        disabled={saving}
        className="grid size-12 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-wait disabled:opacity-70 aria-pressed:border-primary/40 aria-pressed:bg-primary/10 aria-pressed:text-primary"
      >
        {saving ? (
          <Loader2 aria-hidden="true" className="size-6 animate-spin" />
        ) : (
          <Bookmark
            aria-hidden="true"
            className={saved ? "size-6 fill-current" : "size-6"}
          />
        )}
      </button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onShare}
        aria-label="Share job"
        className="size-12 rounded-lg"
      >
        <Share2 aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
}
