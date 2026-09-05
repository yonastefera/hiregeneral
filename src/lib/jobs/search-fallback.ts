export function shouldUseDirectJobsFallback(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const record = error as { code?: unknown; message?: unknown };
  const message =
    typeof record.message === "string" ? record.message.toLowerCase() : "";

  return (
    record.code === "PGRST202" ||
    record.code === "42883" ||
    message.includes("search_job_cards_public") ||
    message.includes("search_jobs_public") ||
    message.includes("search_jobs_knowledge_public")
  );
}
