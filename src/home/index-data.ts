import type { Job } from "@/lib/db/types";
import { toJobCardShape, type JobCardJob } from "@/lib/jobs/card-shape";

const HIGHLIGHTED_JOBS_PAGE = "1";
const HIGHLIGHTED_JOBS_PAGE_SIZE = "3";
const HIGHLIGHTED_JOBS_LOOKBACK_DAYS = "3650";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export async function getIndexPageData(): Promise<{
  highlightedJobs: JobCardJob[];
}> {
  try {
    const seed = `home:${new Date().toISOString().slice(0, 13)}`;
    const params = new URLSearchParams({
      page: HIGHLIGHTED_JOBS_PAGE,
      pageSize: HIGHLIGHTED_JOBS_PAGE_SIZE,
      daysAgo: HIGHLIGHTED_JOBS_LOOKBACK_DAYS,
      seed,
    });

    const response = await fetch(`${SITE_URL}/api/jobs?${params.toString()}`, {
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      return {
        highlightedJobs: [],
      };
    }

    const body = (await response.json()) as { data?: unknown };

    const jobs: Job[] = Array.isArray(body.data) ? (body.data as Job[]) : [];

    return {
      highlightedJobs: jobs
        .slice(0, Number(HIGHLIGHTED_JOBS_PAGE_SIZE))
        .map(toJobCardShape),
    };
  } catch {
    return {
      highlightedJobs: [],
    };
  }
}
