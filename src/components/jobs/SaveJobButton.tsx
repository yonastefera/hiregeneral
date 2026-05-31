"use client";

import { Bookmark, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type SaveJobButtonProps = {
  jobId: string;
  saved: boolean;
  saving?: boolean;
  onSave: (jobId: string) => void;
};

export function SaveJobButton({
  jobId,
  saved,
  saving = false,
  onSave,
}: SaveJobButtonProps) {
  const onSaveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (saving) return;

    onSave(jobId);
  };

  return (
    <button
      type="button"
      aria-label={saved ? "Remove saved job" : "Save job"}
      aria-pressed={saved}
      disabled={saving}
      onClick={onSaveClick}
      className={cn(
        "relative z-10 grid size-10 shrink-0 place-items-center rounded-lg bg-transparent text-muted-foreground transition-colors",
        "hover:bg-transparent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        saved && "text-primary",
        saving && "cursor-wait opacity-80",
      )}
    >
      {saving ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <Bookmark
          className={cn("size-5", saved && "fill-current")}
          strokeWidth={2}
        />
      )}
    </button>
  );
}
