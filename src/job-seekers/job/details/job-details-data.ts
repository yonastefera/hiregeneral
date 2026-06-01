import "server-only";

import { headers } from "next/headers";

import type { Job } from "@/lib/db/types";
import { cleanJob } from "./job-details-utils";

type JobDetailsPageData = {
  job: Job | null;
  related: Job[];
};

const JOB_DETAIL_REVALIDATE_SECONDS = 600; // 10 minutes
const RELATED_JOBS_REVALIDATE_SECONDS = 1800; // 30 minutes

async function getBaseUrl() {
  const headersList = await headers();

  const host = headersList.get("host");

  if (!host) return null;

  const protocol =
    headersList.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");

  return `${protocol}://${host}`;
}

async function fetchJob(jobId: string) {
  const baseUrl = await getBaseUrl();

  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
      next: {
        // Public job detail data is mostly stable, but expiration/status can change.
        revalidate: JOB_DETAIL_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) return null;

    const body = (await response.json()) as Job;

    return cleanJob(body);
  } catch {
    return null;
  }
}

function buildRelatedSearches(job: Job) {
  return [
    job.category
      ? new URLSearchParams({
          category: job.category,
          pageSize: "3",
          excludeId: job.id,
        })
      : null,
    new URLSearchParams({
      company: job.company_name,
      pageSize: "3",
      excludeId: job.id,
    }),
    new URLSearchParams({
      query: job.title.split(/\s+/).slice(0, 2).join(" "),
      pageSize: "3",
      excludeId: job.id,
    }),
  ].filter((params): params is URLSearchParams => Boolean(params));
}

async function fetchRelatedJobs(job: Job, jobId: string) {
  const baseUrl = await getBaseUrl();

  if (!baseUrl) return [];

  const searches = buildRelatedSearches(job);

  for (const params of searches) {
    try {
      const response = await fetch(`${baseUrl}/api/jobs?${params.toString()}`, {
        next: {
          // Related jobs can be slightly less fresh than the main job detail.
          revalidate: RELATED_JOBS_REVALIDATE_SECONDS,
        },
      });

      if (!response.ok) continue;

      const body = await response.json();
      const jobs = Array.isArray(body.data) ? (body.data as Job[]) : [];

      const cleanedRelated = jobs
        .map(cleanJob)
        .filter((relatedJob) => relatedJob.id !== job.id)
        .filter((relatedJob) => relatedJob.slug !== jobId);

      if (cleanedRelated.length > 0) {
        return cleanedRelated.slice(0, 3);
      }
    } catch {
      continue;
    }
  }

  return [];
}

export async function getJobDetailsPageData(
  jobId: string,
): Promise<JobDetailsPageData> {
  const job = await fetchJob(jobId);

  if (!job) {
    return {
      job: null,
      related: [],
    };
  }

  const related = await fetchRelatedJobs(job, jobId);

  return {
    job,
    related,
  };
}
