import type { ImportedJob } from "../normalize";
import type { JobSource } from "../job-sources";
import { fetchPreloadedCareerJobs } from "./shared";

export function fetchFedExPreloadJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  return fetchPreloadedCareerJobs(source, context);
}
