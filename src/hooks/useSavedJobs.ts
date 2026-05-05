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
  const [ids, setIds] = useState<string[]>(() => read());
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isSaved = useCallback((jobId: string) => ids.includes(jobId), [ids]);

  const toggleSaved = useCallback(async (jobId: string) => {
    setPendingId(jobId);
    // Brief delay to show saving state UX
    await new Promise((r) => setTimeout(r, 280));
    const current = read();
    const next = current.includes(jobId)
      ? current.filter((id) => id !== jobId)
      : [...current, jobId];
    write(next);
    setIds(next);
    setPendingId(null);
    return next.includes(jobId);
  }, []);

  return { savedIds: ids, isSaved, toggleSaved, pendingId };
}
