"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase/client";

const KEY = "hg.savedJobs.v1";
const EVENT = "hg:savedJobs:changed";

type SavedJobsResponse = {
  data?: Array<{
    jobs?: {
      id?: string;
    } | null;
  }>;
};

type ToggleSavedResponse = {
  saved: boolean;
};

function normalizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];

  return Array.from(
    new Set(ids.filter((id): id is string => typeof id === "string")),
  );
}

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return normalizeIds(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  const normalized = normalizeIds(ids);
  localStorage.setItem(KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useSavedJobs() {
  const [ids, setIds] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const requestSeqRef = useRef(0);

  useEffect(() => {
    const sync = () => {
      setIds(read());
    };

    const syncStorage = (event: StorageEvent) => {
      if (event.key === KEY) sync();
    };

    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", syncStorage);

    setIds(read());

    const controller = new AbortController();

    async function loadSavedJobs() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          write([]);
          setIds([]);
          return;
        }

        const response = await fetch("/api/saved", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          write([]);
          setIds([]);
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load saved jobs.");
        }

        const body = (await response.json()) as SavedJobsResponse;

        const savedIds = Array.isArray(body.data)
          ? body.data
              .map((item) => item.jobs?.id)
              .filter((id): id is string => typeof id === "string")
          : [];

        write(savedIds);
        setIds(normalizeIds(savedIds));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setIds(read());
      }
    }

    loadSavedJobs();

    return () => {
      controller.abort();
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const isSaved = useCallback((jobId: string) => ids.includes(jobId), [ids]);

  const toggleSaved = useCallback(async (jobId: string) => {
    const requestSeq = ++requestSeqRef.current;

    const previous = read();
    const next = previous.includes(jobId)
      ? previous.filter((id) => id !== jobId)
      : [...previous, jobId];

    write(next);
    setIds(normalizeIds(next));
    setPendingId(jobId);

    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });

      if (response.status === 401) {
        write([]);
        setIds([]);
        return false;
      }

      if (!response.ok) {
        throw new Error("Could not update saved job.");
      }

      const body = (await response.json()) as ToggleSavedResponse;

      if (requestSeq !== requestSeqRef.current) {
        return body.saved;
      }

      const current = read();
      const confirmed = body.saved
        ? [...current, jobId]
        : current.filter((id) => id !== jobId);

      write(confirmed);
      setIds(normalizeIds(confirmed));

      return body.saved;
    } catch {
      if (requestSeq === requestSeqRef.current) {
        write(previous);
        setIds(previous);
      }

      return previous.includes(jobId);
    } finally {
      if (requestSeq === requestSeqRef.current) {
        setPendingId(null);
      }
    }
  }, []);

  return {
    savedIds: ids,
    isSaved,
    toggleSaved,
    pendingId,
  };
}
