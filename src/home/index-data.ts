import { unstable_cache } from "next/cache";

import type { Job } from "@/lib/db/types";
import { toJobCardShape, type JobCardJob } from "@/lib/jobs/card-shape";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import {
  loadHomeInsights,
  type HomeMarketCategory,
  type HomeSalaryBand,
} from "./home-insights";

const HIGHLIGHTED_JOBS_PAGE_SIZE = 4;
const HIGHLIGHTED_JOBS_LOOKBACK_DAYS = 30;
const FALLBACK_HIGHLIGHTED_JOBS_LOOKBACK_DAYS = 3650;

type CompactSearchPayload = {
  rows?: unknown;
};

async function searchHighlightedJobs(daysAgo: number) {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("search_job_cards_public", {
    p_query: null,
    p_days_ago: daysAgo,
    p_location: null,
    p_work_mode: null,
    p_employment_type: null,
    p_category: null,
    p_company: null,
    p_exclude_id: null,
    p_page: 1,
    p_page_size: HIGHLIGHTED_JOBS_PAGE_SIZE,
    p_balance: "company",
    p_easy_apply: false,
  });

  if (error) {
    throw new Error(`Could not load home featured jobs: ${error.message}`);
  }

  const rows = (data as CompactSearchPayload | null)?.rows;
  return Array.isArray(rows) ? (rows as Job[]) : [];
}

async function loadHighlightedJobs() {
  const recentJobs = await searchHighlightedJobs(
    HIGHLIGHTED_JOBS_LOOKBACK_DAYS,
  );

  if (recentJobs.length > 0) return recentJobs;

  return searchHighlightedJobs(FALLBACK_HIGHLIGHTED_JOBS_LOOKBACK_DAYS);
}

async function getIndexPageDataUncached(): Promise<{
  highlightedJobs: JobCardJob[];
  salaryBands: HomeSalaryBand[];
  marketCategories: HomeMarketCategory[];
}> {
  const fallbackInsights = {
    salaryBands: [],
    marketCategories: [],
  };

  const [jobs, insights] = await Promise.all([
    loadHighlightedJobs().catch((error) => {
      console.error("[getIndexPageData:highlightedJobs]", error);
      return [];
    }),
    loadHomeInsights().catch((error) => {
      console.error("[getIndexPageData:insights]", error);
      return fallbackInsights;
    }),
  ]);

  return {
    highlightedJobs: jobs
      .slice(0, HIGHLIGHTED_JOBS_PAGE_SIZE)
      .map(toJobCardShape),
    salaryBands: insights.salaryBands,
    marketCategories: insights.marketCategories,
  };
}

export const getIndexPageData = unstable_cache(
  getIndexPageDataUncached,
  ["home-index-data-v1"],
  {
    revalidate: 3600,
    tags: ["home-index-data", "home-insights"],
  },
);
