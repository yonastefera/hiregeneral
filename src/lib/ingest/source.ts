import type { JobSource, JobSourceType } from "./job-sources";
import { importedJobSchema, type ImportedJob } from "./normalize";

export type JobSourceAdapter = {
  type: JobSourceType;
  fetchJobs(
    source: JobSource,
    context?: {
      signal?: AbortSignal;
    },
  ): Promise<ImportedJob[]>;
};

export type ValidatedJobsResult = {
  jobs: ImportedJob[];
  rejected: Array<{
    index: number;
    sourceId?: string;
    title?: string;
    issues: string[];
  }>;
};

export function validateImportedJobs(jobs: ImportedJob[]): ValidatedJobsResult {
  const result: ValidatedJobsResult = {
    jobs: [],
    rejected: [],
  };

  jobs.forEach((job, index) => {
    const parsed = importedJobSchema.safeParse(job);

    if (parsed.success) {
      result.jobs.push(parsed.data);
      return;
    }

    result.rejected.push({
      index,
      sourceId: job.sourceId,
      title: job.title,
      issues: parsed.error.issues.map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      }),
    });
  });

  return result;
}

export function deduplicateImportedJobs(jobs: ImportedJob[]) {
  const jobsBySourceId = new Map<string, ImportedJob>();
  let duplicateCount = 0;

  for (const job of jobs) {
    if (jobsBySourceId.has(job.sourceId)) duplicateCount += 1;
    jobsBySourceId.set(job.sourceId, job);
  }

  return { jobs: [...jobsBySourceId.values()], duplicateCount };
}
