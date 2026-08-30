"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type SavedSearch = {
  alert_frequency: "off" | "daily" | "weekly";
  distance_miles: number;
  easy_apply: boolean;
  id: string;
  location: string;
  name: string;
  posted_days: number;
  query: string;
  work_mode: string;
};

function searchHref(search: SavedSearch) {
  const params = new URLSearchParams();
  if (search.query) params.set("query", search.query);
  if (search.location) params.set("location", search.location);
  if (search.posted_days !== 30)
    params.set("posted", String(search.posted_days));
  if (search.distance_miles !== 100)
    params.set("distance", String(search.distance_miles));
  if (search.work_mode) params.set("workMode", search.work_mode);
  if (search.easy_apply) params.set("easyApply", "1");
  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

export default function SavedSearchesPanel() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/saved-searches", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not load saved searches.");
      const body = (await response.json()) as { data?: SavedSearch[] };
      setSearches(body.data ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load saved searches.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateFrequency = async (
    search: SavedSearch,
    alertFrequency: SavedSearch["alert_frequency"],
  ) => {
    setPendingId(search.id);
    const response = await fetch(`/api/saved-searches/${search.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertFrequency }),
    });
    setPendingId(null);

    if (!response.ok) {
      toast.error("Could not update this alert.");
      return;
    }
    setSearches((current) =>
      current.map((item) =>
        item.id === search.id
          ? { ...item, alert_frequency: alertFrequency }
          : item,
      ),
    );
    toast.success("Alert frequency updated.");
  };

  const remove = async (search: SavedSearch) => {
    setPendingId(search.id);
    const response = await fetch(`/api/saved-searches/${search.id}`, {
      method: "DELETE",
    });
    setPendingId(null);

    if (!response.ok) {
      toast.error("Could not delete this saved search.");
      return;
    }
    setSearches((current) => current.filter((item) => item.id !== search.id));
    toast.success("Saved search deleted.");
  };

  return (
    <section className="mt-10" aria-labelledby="saved-searches-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="saved-searches-heading" className="text-xl font-semibold">
            Saved searches
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reopen a search or control alerts for newly posted matches.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/jobs">Create from job search</Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading saved searches...
        </div>
      ) : searches.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          You have no saved searches yet.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {searches.map((search) => (
            <article
              key={search.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-5"
            >
              <div className="min-w-0">
                <Link
                  href={searchHref(search)}
                  className="font-semibold hover:text-primary hover:underline"
                >
                  {search.name}
                </Link>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {[search.query || "All jobs", search.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <BellRing className="size-4 text-muted-foreground" />
                <select
                  aria-label={`Alert frequency for ${search.name}`}
                  value={search.alert_frequency}
                  disabled={pendingId === search.id}
                  onChange={(event) =>
                    void updateFrequency(
                      search,
                      event.target.value as SavedSearch["alert_frequency"],
                    )
                  }
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="off">Off</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${search.name}`}
                  disabled={pendingId === search.id}
                  onClick={() => void remove(search)}
                >
                  {pendingId === search.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
