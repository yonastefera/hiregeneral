import { useCallback, useEffect, useState } from "react";

const KEY = "hg.savedJobs.v1";
const EVENT = "hg:savedJobs:changed";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useSavedJobs() {
  const [ids, setIds] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);

    setIds(read());

    fetch("/api/saved-jobs", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load saved jobs.");
        return response.json();
      })
      .then((body) => {
        const savedIds = Array.isArray(body.data)
          ? body.data
              .map((item: { jobs?: { id?: string } | null }) => item.jobs?.id)
              .filter((id: unknown): id is string => typeof id === "string")
          : [];

        write(savedIds);
        setIds(savedIds);
      })
      .catch(() => {
        setIds(read());
      });

    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isSaved = useCallback((jobId: string) => ids.includes(jobId), [ids]);

  const toggleSaved = useCallback(async (jobId: string) => {
    setPendingId(jobId);

    try {
      const response = await fetch("/api/saved-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });

      if (!response.ok) throw new Error("Could not update saved job.");

      const body = (await response.json()) as { saved: boolean };
      const current = read();
      const next = body.saved
        ? Array.from(new Set([...current, jobId]))
        : current.filter((id) => id !== jobId);

      write(next);
      setIds(next);
      return body.saved;
    } catch {
      const current = read();
      const next = current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId];

      write(next);
      setIds(next);
      return next.includes(jobId);
    } finally {
      setPendingId(null);
    }
  }, []);

  return { savedIds: ids, isSaved, toggleSaved, pendingId };
}
