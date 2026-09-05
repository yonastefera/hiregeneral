import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { publicJobSearchRateLimit, redis } from "@/lib/rate-limit";
import {
  enforceRateLimit,
  logServerError,
  requestIp,
  safeServerError,
} from "@/lib/http/api-security";
import { InFlightCoalescer } from "@/lib/http/in-flight";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import {
  type JobCardEnrichmentRow,
  toCompactJobListItem,
} from "@/lib/jobs/list-item";
import { shouldUseDirectJobsFallback } from "@/lib/jobs/search-fallback";
import {
  dedupeJobListings,
  diversifyJobListings,
  limitJobListingsPerCompany,
} from "@/lib/jobs/result-diversity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabasePublic = createSupabasePublicClient();

const NEW_JOBS_WINDOW_DAYS = 7;
const DEFAULT_COMPANY_BALANCE = "company";
const DEFAULT_DAYS_AGO = 30;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 25;

const JOBS_API_CACHE_VERSION = process.env.JOBS_API_CACHE_VERSION ?? "8";
const JOBS_BROWSE_CACHE_TTL_SECONDS = 60 * 30; // 30 minutes
const JOBS_SEARCH_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes
const JOBS_FILTER_CACHE_TTL_SECONDS = 60 * 10; // 10 minutes
const publicJobQuerySchema = z.object({
  query: z.string().max(160),
  location: z.string().max(160),
  distance: z.string().max(20),
  workMode: z.string().max(40),
  employmentType: z.string().max(40),
  category: z.string().max(100),
  company: z.string().max(160),
  excludeId: z.string().max(100),
  balance: z.enum(["none", "company"]),
});

const JOB_LISTING_SELECT = `
  id,
  recruiter_id,
  company_id,
  company_name,
  company_logo_url,
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
  experience_level,
  category,
  company_tagline,
  company_size,
  company_website
`;

type JobRow = {
  id: string;
  recruiter_id: string;
  company_id: string | null;
  company_name: string;
  company_logo_url: string | null;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  employment_type: string;
  work_mode: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  skills: string[];
  status: string;
  posted_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
  source_name: string | null;
  source_id: string | null;
  apply_url: string | null;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  experience_level: string | null;
  category: string | null;
  company_tagline: string | null;
  company_size: string | null;
  company_website: string | null;
  job_applicant_counts?: Array<{
    applicant_count: number | null;
  }> | null;
};

type JobCandidateRow = Omit<
  JobRow,
  "responsibilities" | "requirements" | "benefits"
> & {
  enrichment?: JobCardEnrichmentRow | null;
};

type JobsPublicRpcRow = Omit<JobCandidateRow, "job_applicant_counts"> & {
  applicant_count: number | null;
  total_count: number | string | null;
  new_jobs_count: number | string | null;
};

type JobsApiPayload = {
  data: unknown[];
  total: number;
  newJobs: number;
  newJobsWindowDays: number;
  balance: "company" | "none";
  seed: string | null;
  page: number;
  pageSize: number;
  totalPages: number;
};

type DirectJobsResult = {
  rows: JobsPublicRpcRow[];
  total: number;
  newJobs: number;
};

const jobSearchCoalescer = new InFlightCoalescer<JobsApiPayload | null>();

function toCount(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toPositiveInteger(
  value: string | null,
  fallback: number,
  max?: number,
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return max ? Math.min(parsed, max) : parsed;
}

function normalizeCachePart(value: string | number | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function hasAnyAdvancedFilter(params: {
  location: string;
  workMode: string;
  employmentType: string;
  category: string;
  company: string;
  excludeId: string;
  easyApply: boolean;
}) {
  return Boolean(
    params.location.trim() ||
    params.workMode ||
    params.employmentType ||
    params.category ||
    params.company.trim() ||
    params.excludeId ||
    params.easyApply,
  );
}

function cacheTtlForRequest(params: {
  query: string;
  location: string;
  workMode: string;
  employmentType: string;
  category: string;
  company: string;
  excludeId: string;
  easyApply: boolean;
}) {
  if (params.query.trim()) {
    return JOBS_SEARCH_CACHE_TTL_SECONDS;
  }

  if (hasAnyAdvancedFilter(params)) {
    return JOBS_FILTER_CACHE_TTL_SECONDS;
  }

  return JOBS_BROWSE_CACHE_TTL_SECONDS;
}

function getJobsApiCacheKey(params: {
  query: string;
  location: string;
  daysAgo: number;
  workMode: string;
  employmentType: string;
  category: string;
  company: string;
  excludeId: string;
  balance: string;
  page: number;
  pageSize: number;
  distance: string;
  easyApply: boolean;
}) {
  return [
    "jobs-api",
    JOBS_API_CACHE_VERSION,
    "public",
    `q:${normalizeCachePart(params.query)}`,
    `loc:${normalizeCachePart(params.location)}`,
    `days:${params.daysAgo}`,
    `work:${normalizeCachePart(params.workMode)}`,
    `type:${normalizeCachePart(params.employmentType)}`,
    `category:${normalizeCachePart(params.category)}`,
    `company:${normalizeCachePart(params.company)}`,
    `exclude:${normalizeCachePart(params.excludeId)}`,
    `balance:${normalizeCachePart(params.balance)}`,
    `easy:${params.easyApply ? "1" : "0"}`,
    `distance:${normalizeCachePart(params.distance)}`,
    `page:${params.page}`,
    `size:${params.pageSize}`,
  ].join(":");
}

function jobsJsonResponse(payload: JobsApiPayload, ttlSeconds: number) {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${
        ttlSeconds * 10
      }`,
    },
  });
}

async function readJobsCache(cacheKey: string) {
  try {
    return await redis.get<JobsApiPayload>(cacheKey);
  } catch (error) {
    logServerError("jobs_cache_read_failed", error);
    return null;
  }
}

async function writeJobsCache(
  cacheKey: string,
  payload: JobsApiPayload,
  ttlSeconds: number,
) {
  try {
    await redis.set(cacheKey, payload, {
      ex: ttlSeconds,
    });
  } catch (error) {
    logServerError("jobs_cache_write_failed", error);
  }
}

function buildJobListItems(candidates: JobCandidateRow[]) {
  return candidates.map((job) =>
    toCompactJobListItem(
      {
        ...job,
        applicant_count: job.job_applicant_counts?.[0]?.applicant_count ?? 0,
      },
      job.enrichment ?? undefined,
    ),
  );
}

function toJobCandidateRows(rows: JobsPublicRpcRow[]) {
  return rows
    .filter((row) => typeof row.id === "string" && row.id.length > 0)
    .map((row) => {
      const {
        applicant_count,
        total_count: _totalCount,
        new_jobs_count: _newJobsCount,
        ...job
      } = row;

      void _totalCount;
      void _newJobsCount;

      return {
        ...job,
        job_applicant_counts: [
          {
            applicant_count: applicant_count ?? 0,
          },
        ],
      } satisfies JobCandidateRow;
    });
}

function isNewJob(row: JobsPublicRpcRow) {
  const postedAt = Date.parse(row.posted_at);
  if (Number.isNaN(postedAt)) return false;

  return Date.now() - postedAt <= NEW_JOBS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function escapePostgrestPattern(value: string) {
  return value.replace(/[%_*]/g, "\\$&");
}

function toIlikePattern(value: string) {
  return `%${escapePostgrestPattern(value.trim())}%`;
}

async function searchJobCardsPublic(params: {
  query: string;
  daysAgo: number;
  location: string;
  workMode: string;
  employmentType: string;
  category: string;
  company: string;
  excludeId: string;
  page: number;
  pageSize: number;
  balance: string;
  easyApply: boolean;
}): Promise<DirectJobsResult> {
  const { data, error } = await supabasePublic.rpc("search_job_cards_public", {
    p_query: params.query.trim() || null,
    p_days_ago: params.daysAgo,
    p_location: params.location.trim() || null,
    p_work_mode: params.workMode || null,
    p_employment_type: params.employmentType || null,
    p_category: params.category || null,
    p_company: params.company.trim() || null,
    p_exclude_id: params.excludeId || null,
    p_page: params.page,
    p_page_size: params.pageSize,
    p_balance: params.balance,
    p_easy_apply: params.easyApply,
  });

  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Job-card search returned an invalid response.");
  }

  const payload = data as Record<string, unknown>;
  return {
    rows: Array.isArray(payload.rows)
      ? (payload.rows as JobsPublicRpcRow[])
      : [],
    total: toCount(payload.total as number | string | null),
    newJobs: toCount(payload.newJobs as number | string | null),
  };
}

async function searchJobsDirect(params: {
  query: string;
  daysAgo: number;
  location: string;
  workMode: string;
  employmentType: string;
  category: string;
  company: string;
  excludeId: string;
  page: number;
  pageSize: number;
  easyApply: boolean;
  balance: string;
}): Promise<DirectJobsResult> {
  const postedAfter = new Date(
    Date.now() - params.daysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  const now = new Date().toISOString();
  const start = (params.page - 1) * params.pageSize;

  let request = supabasePublic
    .from("jobs")
    .select(JOB_LISTING_SELECT, { count: "exact" })
    .eq("status", "published")
    .gte("posted_at", postedAfter)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  const query = params.query.trim();
  const location = params.location.trim();
  const company = params.company.trim();
  if (query) {
    const pattern = toIlikePattern(query);
    request = request.ilike("search_text", pattern);
  }

  if (location) {
    request = request.ilike("location", toIlikePattern(location));
  }

  if (params.workMode) {
    request = request.eq("work_mode", params.workMode);
  }

  if (params.employmentType) {
    request = request.eq("employment_type", params.employmentType);
  }

  if (params.category) {
    request = request.eq("category", params.category);
  }

  if (company) {
    request = request.ilike("company_name", toIlikePattern(company));
  }

  if (params.excludeId) {
    request = request.neq("id", params.excludeId);
  }

  if (params.easyApply) {
    request = request.or("apply_url.is.null,apply_url.eq.");
  }

  const shouldDiversify = params.balance === "company";
  const rangeStart = shouldDiversify ? 0 : start;
  const rangeEnd = shouldDiversify ? 999 : start + params.pageSize - 1;

  const { data, error, count } = await request
    .order("posted_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) {
    throw error;
  }

  const candidateRows = (data ?? []) as JobCandidateRow[];
  const uniqueRows = shouldDiversify
    ? diversifyJobListings(candidateRows)
    : dedupeJobListings(candidateRows);
  const total = shouldDiversify
    ? uniqueRows.length
    : (count ?? uniqueRows.length);
  const pageRows = shouldDiversify
    ? uniqueRows.slice(start, start + params.pageSize)
    : uniqueRows;

  const rows = pageRows.map((job) => ({
    ...job,
    applicant_count: 0,
    total_count: total,
    new_jobs_count: 0,
  }));

  return {
    rows,
    total,
    newJobs: rows.filter(isNewJob).length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const query = searchParams.get("query") ?? "";
    const location = searchParams.get("location") ?? "";
    const daysAgo = toPositiveInteger(
      searchParams.get("daysAgo"),
      DEFAULT_DAYS_AGO,
    );
    const distance = searchParams.get("distance") ?? "";
    const workMode = searchParams.get("workMode") ?? "";
    const easyApply = searchParams.get("easyApply") === "1";
    const employmentType = searchParams.get("employmentType") ?? "";
    const category = searchParams.get("category") ?? "";
    const company = searchParams.get("company") ?? "";
    const excludeId = searchParams.get("excludeId") ?? "";
    const balance = searchParams.get("balance") ?? DEFAULT_COMPANY_BALANCE;
    const page = toPositiveInteger(searchParams.get("page"), 1);
    const pageSize = toPositiveInteger(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );

    const parsedQuery = publicJobQuerySchema.safeParse({
      query,
      location,
      distance,
      workMode,
      employmentType,
      category,
      company,
      excludeId,
      balance,
    });
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Invalid job search parameters." },
        { status: 400 },
      );
    }

    const ttlSeconds = cacheTtlForRequest({
      query,
      location,
      workMode,
      employmentType,
      category,
      company,
      excludeId,
      easyApply,
    });

    const cacheKey = getJobsApiCacheKey({
      query,
      location,
      daysAgo,
      workMode,
      employmentType,
      category,
      company,
      excludeId,
      balance,
      easyApply,
      page,
      pageSize,
      distance,
    });

    const cached = await readJobsCache(cacheKey);

    if (cached) {
      return jobsJsonResponse(cached, ttlSeconds);
    }

    const limited = await enforceRateLimit({
      limiter: publicJobSearchRateLimit,
      key: requestIp(req),
      context: "public_job_search",
    });
    if (limited) return limited;

    const { owner: ownsLoad, value: payload } = await jobSearchCoalescer.run(
      cacheKey,
      async () => {
        let rows: JobsPublicRpcRow[];
        let total: number;
        let newJobs: number;

        try {
          const searchResult = await searchJobCardsPublic({
            query,
            daysAgo,
            location,
            workMode,
            employmentType,
            category,
            company,
            excludeId,
            page,
            pageSize,
            balance,
            easyApply,
          });
          rows = searchResult.rows;
          total = searchResult.total;
          newJobs = searchResult.newJobs;
        } catch (rpcError) {
          if (!shouldUseDirectJobsFallback(rpcError)) {
            logServerError("jobs_search_query_failed", rpcError);
            return null;
          }

          try {
            const fallbackResult = await searchJobsDirect({
              query,
              daysAgo,
              location,
              workMode,
              employmentType,
              category,
              company,
              excludeId,
              page,
              pageSize,
              easyApply,
              balance,
            });

            rows = fallbackResult.rows;
            total = fallbackResult.total;
            newJobs = fallbackResult.newJobs;
          } catch (fallbackError) {
            logServerError("jobs_search_fallback_failed", fallbackError);
            return null;
          }
        }

        rows =
          balance === "company"
            ? limitJobListingsPerCompany(rows, 2)
            : dedupeJobListings(rows);
        const pageCandidates = toJobCandidateRows(rows);
        const pageJobs = buildJobListItems(pageCandidates);
        const isCompanyBalanced = balance === "company";

        return {
          data: pageJobs,
          total,
          newJobs,
          newJobsWindowDays: NEW_JOBS_WINDOW_DAYS,
          balance: isCompanyBalanced ? "company" : "none",
          seed: null,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        } satisfies JobsApiPayload;
      },
    );

    if (!payload) return safeServerError("Failed to load jobs.");
    if (ownsLoad) await writeJobsCache(cacheKey, payload, ttlSeconds);

    return jobsJsonResponse(payload, ttlSeconds);
  } catch (error) {
    logServerError("jobs_search_failed", error);
    return safeServerError("Failed to load jobs.");
  }
}
