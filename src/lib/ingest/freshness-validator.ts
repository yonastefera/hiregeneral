import type { ImportedJob } from "./normalize";

export type FreshnessIssue = {
  sourceId: string;
  reason: "already_expired" | "future_posted_at";
};

const MAX_FUTURE_POSTED_MS = 24 * 60 * 60 * 1000;

export function validateJobFreshness(jobs: ImportedJob[], now = new Date()) {
  const nowTime = now.getTime();
  const issues: FreshnessIssue[] = [];
  const validJobs = jobs.filter((job) => {
    const expiresAt = job.expiresAt ? Date.parse(job.expiresAt) : null;
    if (expiresAt !== null && expiresAt <= nowTime) {
      issues.push({ sourceId: job.sourceId, reason: "already_expired" });
      return false;
    }

    if (Date.parse(job.postedAt) > nowTime + MAX_FUTURE_POSTED_MS) {
      issues.push({ sourceId: job.sourceId, reason: "future_posted_at" });
      return false;
    }

    return true;
  });

  return { jobs: validJobs, issues };
}
