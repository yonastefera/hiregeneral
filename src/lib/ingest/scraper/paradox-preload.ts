import type { ImportedJob } from "../normalize";
import type { JobSource } from "../job-sources";
import { fetchPreloadedCareerJobs, metadataNumber } from "./shared";

export function fetchParadoxPreloadJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const maxPages = Math.max(metadataNumber(source, "maxPages") ?? 6, 1);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  return (async () => {
    for (let page = 1; page <= maxPages; page += 1) {
      const pageUrl = new URL(
        source.sourceUrl ?? "https://careers.nordstrom.com/jobs",
      );

      if (page > 1) {
        const basePath = pageUrl.pathname.replace(/\/page\/\d+\/?$/i, "");
        pageUrl.pathname = `${basePath.replace(/\/$/, "")}/page/${page}`;
      }

      const pageJobs = await fetchPreloadedCareerJobs(
        {
          ...source,
          sourceUrl: pageUrl.toString(),
        },
        context,
      );

      if (pageJobs.length === 0) break;

      for (const job of pageJobs) {
        if (seenSourceIds.has(job.sourceId)) continue;

        seenSourceIds.add(job.sourceId);
        jobs.push(job);
      }
    }

    return jobs;
  })();
}
