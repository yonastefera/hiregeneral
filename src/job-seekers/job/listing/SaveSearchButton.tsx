"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { JobsSearchState } from "./search-options";

function suggestedName(state: JobsSearchState) {
  return [state.query.trim() || "All jobs", state.location.trim()]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 80);
}

export default function SaveSearchButton({
  state,
}: {
  state: JobsSearchState;
}) {
  const router = useRouter();
  const defaultName = useMemo(() => suggestedName(state), [state]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [frequency, setFrequency] = useState<"off" | "daily" | "weekly">(
    "weekly",
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);

    try {
      const response = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          query: state.query.trim(),
          location: state.location.trim(),
          postedDays: Number(state.dateFilter),
          distanceMiles: Number(state.distance),
          workMode: state.workMode,
          easyApply: state.easyApply,
          alertFrequency: frequency,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (response.status === 401) {
        router.push(
          `/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        );
        return;
      }
      if (!response.ok) {
        throw new Error(body?.error ?? "Could not save this search.");
      }

      toast.success("Search saved.");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save this search.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setName(defaultName);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="mt-5 w-full gap-2">
          <BookmarkPlus className="size-4" />
          Save this search
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this search</DialogTitle>
          <DialogDescription>
            Return to these filters anytime and choose how often to hear about
            newly posted matches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <label
            className="block text-sm font-medium"
            htmlFor="saved-search-name"
          >
            Search name
          </label>
          <Input
            id="saved-search-name"
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
          />

          <label
            className="block text-sm font-medium"
            htmlFor="alert-frequency"
          >
            Email alerts
          </label>
          <select
            id="alert-frequency"
            value={frequency}
            onChange={(event) =>
              setFrequency(event.target.value as "off" | "daily" | "weekly")
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
            <option value="off">Off</option>
          </select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
