import type { Job } from "@/lib/db/types";
import { toJobCardShape, type JobCardJob } from "@/lib/jobs/card-shape";
import type { HomeMarketCategory, HomeSalaryBand } from "./home-insights";

const HIGHLIGHTED_JOBS_PAGE = "1";
const HIGHLIGHTED_JOBS_PAGE_SIZE = "4";
const HIGHLIGHTED_JOBS_LOOKBACK_DAYS = "3650";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export async function getIndexPageData(): Promise<{
  highlightedJobs: JobCardJob[];
  salaryBands: HomeSalaryBand[];
  marketCategories: HomeMarketCategory[];
}> {
  try {
    const seed = `home:${new Date().toISOString().slice(0, 13)}`;
    const params = new URLSearchParams({
      page: HIGHLIGHTED_JOBS_PAGE,
      pageSize: HIGHLIGHTED_JOBS_PAGE_SIZE,
      daysAgo: HIGHLIGHTED_JOBS_LOOKBACK_DAYS,
      seed,
    });

    const [jobsResponse, insightsResponse] = await Promise.all([
      fetch(`${SITE_URL}/api/jobs?${params.toString()}`, {
        next: {
          revalidate: 3600,
        },
      }),
      fetch(`${SITE_URL}/api/home/insights`, {
        next: {
          revalidate: 3600,
        },
      }),
    ]);

    if (!jobsResponse.ok) {
      return {
        highlightedJobs: [],
        salaryBands: [],
        marketCategories: [],
      };
    }

    const jobsBody = (await jobsResponse.json()) as { data?: unknown };
    const insightsBody = insightsResponse.ok
      ? ((await insightsResponse.json()) as {
          salaryBands?: unknown;
          marketCategories?: unknown;
        })
      : {};

    const jobs: Job[] = Array.isArray(jobsBody.data)
      ? (jobsBody.data as Job[])
      : [];

    return {
      highlightedJobs: jobs
        .slice(0, Number(HIGHLIGHTED_JOBS_PAGE_SIZE))
        .map(toJobCardShape),
      salaryBands: Array.isArray(insightsBody.salaryBands)
        ? (insightsBody.salaryBands as HomeSalaryBand[])
        : [],
      marketCategories: Array.isArray(insightsBody.marketCategories)
        ? (insightsBody.marketCategories as HomeMarketCategory[])
        : [],
    };
  } catch {
    return {
      highlightedJobs: [],
      salaryBands: [],
      marketCategories: [],
    };
  }
}
