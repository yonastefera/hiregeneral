import type { Job } from "@/lib/db/types";
import { toJobCardShape, type JobCardJob } from "@/lib/jobs/card-shape";
import {
  loadHomeInsights,
  type HomeMarketCategory,
  type HomeSalaryBand,
} from "./home-insights";

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
  const fallbackInsights = {
    salaryBands: [],
    marketCategories: [],
  };

  try {
    const seed = `home:${new Date().toISOString().slice(0, 13)}`;
    const params = new URLSearchParams({
      page: HIGHLIGHTED_JOBS_PAGE,
      pageSize: HIGHLIGHTED_JOBS_PAGE_SIZE,
      daysAgo: HIGHLIGHTED_JOBS_LOOKBACK_DAYS,
      seed,
    });

    const [jobsResult, insights] = await Promise.all([
      fetch(`${SITE_URL}/api/jobs?${params.toString()}`, {
        next: {
          revalidate: 3600,
        },
      }).catch(() => null),
      loadHomeInsights().catch((error) => {
        console.error("[getIndexPageData:insights]", error);
        return fallbackInsights;
      }),
    ]);

    const jobsBody = jobsResult?.ok
      ? ((await jobsResult.json()) as { data?: unknown })
      : { data: [] };

    const jobs: Job[] = Array.isArray(jobsBody.data)
      ? (jobsBody.data as Job[])
      : [];

    return {
      highlightedJobs: jobs
        .slice(0, Number(HIGHLIGHTED_JOBS_PAGE_SIZE))
        .map(toJobCardShape),
      salaryBands: insights.salaryBands,
      marketCategories: insights.marketCategories,
    };
  } catch (error) {
    console.error("[getIndexPageData]", error);

    return {
      highlightedJobs: [],
      ...fallbackInsights,
    };
  }
}
