import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { redis } from "@/lib/rate-limit";
import {
  JOB_ENRICHMENT_SELECT,
  mapJobEnrichments,
} from "@/lib/jobs/enrichment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const NEW_JOBS_WINDOW_DAYS = 7;
const DEFAULT_COMPANY_BALANCE = "company";
const DEFAULT_DAYS_AGO = 3650;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 25;
const EASY_APPLY_SCAN_PAGE_SIZE = 25;
const EASY_APPLY_MAX_SCAN_PAGES = 40;

const JOBS_API_CACHE_VERSION = process.env.JOBS_API_CACHE_VERSION ?? "1";
const JOBS_BROWSE_CACHE_TTL_SECONDS = 60 * 3; // 3 minutes
const JOBS_SEARCH_CACHE_TTL_SECONDS = 60; // 1 minute
const JOBS_FILTER_CACHE_TTL_SECONDS = 60 * 2; // 2 minutes

const JOB_DETAIL_SELECT = `
  id,
  description,
  responsibilities,
  requirements,
  benefits
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
>;

type JobDetailRow = Pick<
  JobRow,
  "id" | "description" | "responsibilities" | "requirements" | "benefits"
>;

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
    console.error("[GET /api/jobs] Redis read failed. Continuing.", error);
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
    console.error("[GET /api/jobs] Redis write failed. Continuing.", error);
  }
}

function stripHtml(input: string | null | undefined) {
  if (!input) return "";

  const decoded = input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&rsquo;/gi, "’")
    .replace(/&ldquo;/gi, "“")
    .replace(/&rdquo;/gi, "”");

  return decoded
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function hydrateJobDetails(candidates: JobCandidateRow[]) {
  if (candidates.length === 0) return [];

  const ids = candidates.map((job) => job.id);
  const [{ data, error }, { data: enrichmentRows, error: enrichmentError }] =
    await Promise.all([
      supabaseAdmin.from("jobs").select(JOB_DETAIL_SELECT).in("id", ids),
      supabaseAdmin
        .from("job_enrichments")
        .select(JOB_ENRICHMENT_SELECT)
        .in("job_id", ids)
        .eq("status", "ready"),
    ]);

  if (error) {
    throw new Error(`Could not load job details: ${error.message}`);
  }

  if (enrichmentError && enrichmentError.code !== "42P01") {
    throw new Error(
      `Could not load job enrichments: ${enrichmentError.message}`,
    );
  }

  const detailsById = new Map(
    ((data ?? []) as JobDetailRow[]).map((job) => [job.id, job]),
  );
  const enrichmentsByJobId = enrichmentError
    ? new Map()
    : mapJobEnrichments(enrichmentRows ?? []);

  return candidates.map((job) => {
    const details = detailsById.get(job.id);

    return {
      ...job,
      description: stripHtml(details?.description ?? job.description),
      responsibilities: details?.responsibilities ?? [],
      requirements: details?.requirements ?? [],
      benefits: details?.benefits ?? [],
      applicant_count: job.job_applicant_counts?.[0]?.applicant_count ?? 0,
      enrichment: enrichmentsByJobId.get(job.id) ?? null,
    };
  });
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

function isEasyApplyRow(row: JobsPublicRpcRow) {
  return !row.apply_url?.trim();
}

function isNewJob(row: JobsPublicRpcRow) {
  const postedAt = Date.parse(row.posted_at);
  if (Number.isNaN(postedAt)) return false;

  return Date.now() - postedAt <= NEW_JOBS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

async function searchJobsPublic(params: {
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
}) {
  const { data, error } = await supabaseAdmin.rpc("search_jobs_public", {
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
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as JobsPublicRpcRow[];
}

async function getEasyApplyRows(params: {
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
}) {
  const matchedRows: JobsPublicRpcRow[] = [];
  let originalTotal = 0;

  for (let page = 1; page <= EASY_APPLY_MAX_SCAN_PAGES; page += 1) {
    const rows = await searchJobsPublic({
      ...params,
      page,
      pageSize: EASY_APPLY_SCAN_PAGE_SIZE,
    });

    if (page === 1) {
      originalTotal = toCount(rows[0]?.total_count);
    }

    matchedRows.push(...rows.filter(isEasyApplyRow));

    if (
      rows.length < EASY_APPLY_SCAN_PAGE_SIZE ||
      page * EASY_APPLY_SCAN_PAGE_SIZE >= originalTotal
    ) {
      break;
    }
  }

  const total = matchedRows.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;

  return {
    rows: matchedRows.slice(start, end),
    total,
    newJobs: matchedRows.filter(isNewJob).length,
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

    let rows: JobsPublicRpcRow[];
    let total: number;
    let newJobs: number;

    try {
      if (easyApply) {
        const easyApplyResult = await getEasyApplyRows({
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
        });

        rows = easyApplyResult.rows;
        total = easyApplyResult.total;
        newJobs = easyApplyResult.newJobs;
      } else {
        rows = await searchJobsPublic({
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
        });

        total = toCount(rows[0]?.total_count);
        newJobs = toCount(rows[0]?.new_jobs_count);
      }
    } catch (rpcError) {
      console.error("[GET /api/jobs] search_jobs_public failed:", rpcError);

      return NextResponse.json(
        {
          error: "Failed to load jobs.",
          details: rpcError,
        },
        { status: 500 },
      );
    }

    const pageCandidates = toJobCandidateRows(rows);
    const pageJobs = await hydrateJobDetails(pageCandidates);
    const isCompanyBalanced = balance === "company";

    const payload: JobsApiPayload = {
      data: pageJobs,
      total,
      newJobs,
      newJobsWindowDays: NEW_JOBS_WINDOW_DAYS,
      balance: isCompanyBalanced ? "company" : "none",
      seed: null,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };

    await writeJobsCache(cacheKey, payload, ttlSeconds);

    return jobsJsonResponse(payload, ttlSeconds);
  } catch (error) {
    console.error("[GET /api/jobs] Fatal error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}
