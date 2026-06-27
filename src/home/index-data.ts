import type { Job } from "@/lib/db/types";
import { toJobCardShape, type JobCardJob } from "@/lib/jobs/card-shape";
import {
  JOB_ENRICHMENT_SELECT,
  mapJobEnrichments,
} from "@/lib/jobs/enrichment";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { htmlToText } from "@/lib/text/html";
import {
  loadHomeInsights,
  type HomeMarketCategory,
  type HomeSalaryBand,
} from "./home-insights";

const HIGHLIGHTED_JOBS_PAGE_SIZE = 4;
const HIGHLIGHTED_JOBS_LOOKBACK_DAYS = 30;
const FALLBACK_HIGHLIGHTED_JOBS_LOOKBACK_DAYS = 3650;

const HOME_JOB_SELECT = `
  id,
  recruiter_id,
  company_id,
  company_name,
  company_logo_url,
  company_tagline,
  company_size,
  company_website,
  title,
  description,
  location,
  latitude,
  longitude,
  employment_type,
  work_mode,
  salary_min,
  salary_max,
  salary_currency,
  skills,
  status,
  posted_at,
  expires_at,
  created_at,
  updated_at,
  slug,
  source_name,
  source_id,
  apply_url,
  responsibilities,
  requirements,
  benefits,
  experience_level,
  category
`;

type HomeJobBaseRow = Omit<
  Job,
  "applicant_count" | "enrichment" | "slug" | "status"
> & {
  slug: string | null;
  status: string;
};

type JobEnrichmentRows = Parameters<typeof mapJobEnrichments>[0];

async function hydrateHighlightedJobEnrichments(rows: HomeJobBaseRow[]) {
  if (rows.length === 0) return [];

  const supabase = createSupabaseAdminClient();
  const ids = rows.map((job) => job.id);
  const { data: enrichmentRows, error: enrichmentError } = await supabase
    .from("job_enrichments")
    .select(JOB_ENRICHMENT_SELECT)
    .in("job_id", ids)
    .eq("status", "ready");

  if (enrichmentError && enrichmentError.code !== "42P01") {
    throw new Error(
      `Could not load home job enrichments: ${enrichmentError.message}`,
    );
  }

  const enrichmentsByJobId = enrichmentError
    ? new Map()
    : mapJobEnrichments((enrichmentRows ?? []) as JobEnrichmentRows);

  return rows.map(
    (job) =>
      ({
        ...job,
        slug: job.slug ?? job.id,
        status: job.status as Job["status"],
        description: htmlToText(job.description),
        responsibilities: job.responsibilities ?? [],
        requirements: job.requirements ?? [],
        benefits: job.benefits ?? [],
        applicant_count: 0,
        enrichment: enrichmentsByJobId.get(job.id) ?? null,
      }) satisfies Job,
  );
}

async function searchHighlightedJobs(daysAgo: number) {
  const supabase = createSupabaseAdminClient();
  const postedAfter = new Date(
    Date.now() - daysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await supabase
    .from("jobs")
    .select(HOME_JOB_SELECT)
    .eq("status", "published")
    .gte("posted_at", postedAfter)
    .order("posted_at", { ascending: false })
    .limit(HIGHLIGHTED_JOBS_PAGE_SIZE);

  if (error) {
    throw new Error(`Could not load home featured jobs: ${error.message}`);
  }

  return hydrateHighlightedJobEnrichments((data ?? []) as HomeJobBaseRow[]);
}

async function loadHighlightedJobs() {
  const recentJobs = await searchHighlightedJobs(
    HIGHLIGHTED_JOBS_LOOKBACK_DAYS,
  );

  if (recentJobs.length > 0) {
    return recentJobs;
  }

  return searchHighlightedJobs(FALLBACK_HIGHLIGHTED_JOBS_LOOKBACK_DAYS);
}

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
  } catch (error) {
    console.error("[getIndexPageData]", error);

    return {
      highlightedJobs: [],
      ...fallbackInsights,
    };
  }
}
