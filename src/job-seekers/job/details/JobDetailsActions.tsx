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
import { cn } from "@/lib/utils";

type JobDetailsActionsProps = {
  jobId: string;
  slug?: string | null;
  companyName: string;
  title: string;
  applyUrl?: string | null;
  variant?: "hero" | "cta" | "apply-card";
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
      <div className="flex flex-wrap gap-3">
        <Button
          className="h-13 bg-white px-7 text-emerald-900 shadow-xl shadow-emerald-950/20 hover:bg-white/95"
          size="lg"
          onClick={onApply}
        >
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
          className={cn(
            "h-13 border-white/25 bg-white/10 px-7 text-white hover:bg-white/15",
            saved && "bg-white text-emerald-900 hover:bg-white/95",
          )}
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

  if (variant === "apply-card") {
    return (
      <div>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-700 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.99]"
        >
          {isExternal ? `Apply on ${companyName}` : "Apply now"}
          {isExternal ? (
            <ExternalLink aria-hidden="true" className="size-4" />
          ) : (
            <ArrowUpRight aria-hidden="true" className="size-4" />
          )}
        </button>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={saved}
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-teal-50 px-4 py-2.5 text-[13px] font-medium text-teal-800 ring-1 ring-teal-200/60 transition hover:bg-teal-100 disabled:cursor-wait disabled:opacity-70"
          >
            {saving ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <Bookmark
                aria-hidden="true"
                className={cn("size-3.5", saved && "fill-current")}
              />
            )}
            {saving ? "Saving..." : saved ? "Saved" : "Save"}
          </button>

          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-orange-50 px-4 py-2.5 text-[13px] font-medium text-orange-800 ring-1 ring-orange-200/60 transition hover:bg-orange-100"
          >
            <Share2 aria-hidden="true" className="size-3.5" />
            Share
          </button>
        </div>
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
