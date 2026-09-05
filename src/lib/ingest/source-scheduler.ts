import type { JobSource } from "./job-sources";

export type SourceSchedule = {
  sourceName: string;
  sourceSlug: string;
  lastAttemptAt: string | null;
};

const DEFAULT_BATCH_SIZE = 12;

export function ingestionBatchSize() {
  const configured = Number(process.env.INGEST_SOURCE_BATCH_SIZE);
  return Number.isInteger(configured) && configured > 0
    ? Math.min(configured, 50)
    : DEFAULT_BATCH_SIZE;
}

export function selectScheduledSources(
  sources: JobSource[],
  schedule: SourceSchedule[],
  limit: number,
) {
  const lastAttemptBySource = new Map(
    schedule.map((entry) => [
      `${entry.sourceName}:${entry.sourceSlug}`,
      entry.lastAttemptAt ? Date.parse(entry.lastAttemptAt) : 0,
    ]),
  );

  return [...sources]
    .sort((left, right) => {
      const leftAttempt =
        lastAttemptBySource.get(`${left.sourceType}:${left.sourceSlug}`) ?? 0;
      const rightAttempt =
        lastAttemptBySource.get(`${right.sourceType}:${right.sourceSlug}`) ?? 0;

      return (
        leftAttempt - rightAttempt ||
        left.companyName.localeCompare(right.companyName) ||
        left.sourceSlug.localeCompare(right.sourceSlug)
      );
    })
    .slice(0, Math.max(0, limit));
}
