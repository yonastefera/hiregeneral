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

const MAX_CANDIDATE_JOBS = 5000;
const MIN_BROWSE_CANDIDATE_JOBS = 600;
const NEW_JOBS_WINDOW_DAYS = 7;
const DEFAULT_COMPANY_BALANCE = "company";
const DEFAULT_FRESHNESS_WINDOW_DAYS = 30;

const JOBS_API_CACHE_VERSION = process.env.JOBS_API_CACHE_VERSION ?? "1";
const JOBS_BROWSE_CACHE_TTL_SECONDS = 60 * 3; // 3 minutes
const JOBS_KEYWORD_CACHE_TTL_SECONDS = 60; // 1 minute

const JOB_CANDIDATE_SELECT = `
  id,
  recruiter_id,
  company_id,
  company_name,
  company_logo_url,
  company_tagline,
  company_size,
  company_website,
  title,
  location,
  latitude,
  longitude,
  employment_type,
  work_mode,
  experience_level,
  category,
  salary_min,
  salary_max,
  salary_currency,
  skills,
  status,
  slug,
  apply_url,
  source_name,
  source_id,
  posted_at,
  expires_at,
  created_at,
  updated_at,
  description,
  job_applicant_counts ( applicant_count )
`;

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

type DiverseBrowseRpcRow = Omit<JobCandidateRow, "job_applicant_counts"> & {
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

function normalizeCachePart(value: string | number | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getJobsApiCacheKey(params: {
  mode: "browse" | "keyword";
  query: string;
  location: string;
  daysAgo: number;
  page: number;
  pageSize: number;
  distance: string;
}) {
  return [
    "jobs-api",
    JOBS_API_CACHE_VERSION,
    params.mode,
    `q:${normalizeCachePart(params.query)}`,
    `loc:${normalizeCachePart(params.location)}`,
    `days:${params.daysAgo}`,
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

function seededHash(value: string) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function defaultBrowseSeed() {
  return new Date().toISOString().slice(0, 10);
}

function freshnessTier(postedAt: string) {
  const postedTime = new Date(postedAt).getTime();

  if (Number.isNaN(postedTime)) return 3;

  const ageDays = Math.floor((Date.now() - postedTime) / 86_400_000);

  if (ageDays <= NEW_JOBS_WINDOW_DAYS) return 0;
  if (ageDays <= DEFAULT_FRESHNESS_WINDOW_DAYS) return 1;

  return 2;
}

function rotateBroadBrowseJobs<
  T extends { id: string; company_name: string; posted_at: string },
>(jobs: T[], seed: string) {
  return [...jobs].sort((a, b) => {
    const freshnessDiff =
      freshnessTier(a.posted_at) - freshnessTier(b.posted_at);

    if (freshnessDiff !== 0) return freshnessDiff;

    const companyDiff =
      seededHash(`${seed}:company:${a.company_name.toLowerCase()}`) -
      seededHash(`${seed}:company:${b.company_name.toLowerCase()}`);

    if (companyDiff !== 0) return companyDiff;

    return (
      seededHash(`${seed}:job:${a.id}`) - seededHash(`${seed}:job:${b.id}`)
    );
  });
}

function balanceJobsByCompany<T extends { company_name: string }>(jobs: T[]) {
  const groups = new Map<string, T[]>();
  const order: string[] = [];

  for (const job of jobs) {
    const key = job.company_name.toLowerCase();
    const group = groups.get(key);

    if (group) {
      group.push(job);
    } else {
      groups.set(key, [job]);
      order.push(key);
    }
  }

  const balanced: T[] = [];
  let added = true;

  while (added) {
    added = false;

    for (const key of order) {
      const job = groups.get(key)?.shift();

      if (job) {
        balanced.push(job);
        added = true;
      }
    }
  }

  return balanced;
}

function shouldBalanceCompanyResults(params: {
  query: string;
  location: string;
  workMode: string;
  employmentType: string;
  category: string;
  company: string;
  excludeId: string;
  balance: string;
}) {
  if (params.balance !== "company") return false;

  const hasKeywordIntent = Boolean(params.query.trim());
  const hasSpecificCompanyIntent = Boolean(params.company.trim());
  const hasDetailIntent = Boolean(
    params.workMode ||
    params.employmentType ||
    params.category ||
    params.excludeId,
  );

  // Balance broad browsing searches, including location-only searches.
  return !hasKeywordIntent && !hasSpecificCompanyIntent && !hasDetailIntent;
}

function candidateLimitForRequest(params: {
  page: number;
  pageSize: number;
  shouldBalanceByCompany: boolean;
}) {
  if (!params.shouldBalanceByCompany) return MAX_CANDIDATE_JOBS;

  return Math.min(
    MAX_CANDIDATE_JOBS,
    Math.max(MIN_BROWSE_CANDIDATE_JOBS, params.page * params.pageSize * 4),
  );
}

function locationSearchTerm(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);
}

function normalizeSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function escapeIlikeValue(value: string) {
  return value.replace(/[%_]/g, "\\$&").replace(/,/g, " ");
}

function getSearchTokens(query: string) {
  const normalized = normalizeSearchTerm(query);

  if (!normalized) return [];

  return normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .slice(0, 6);
}

function expandedSearchTerms(query: string) {
  const normalized = normalizeSearchTerm(query);
  if (!normalized) return [];

  const terms = new Set([normalized, ...getSearchTokens(normalized)]);

  if (/\bdata\s+engineer\b/.test(normalized)) {
    terms.add("data engineering");
    terms.add("data platform");
    terms.add("etl");
  }

  if (/\bdata\s+science\b|\bdata\s+scientist\b/.test(normalized)) {
    terms.add("machine learning");
    terms.add("analytics");
  }

  if (/\bdata\s+analytics?\b|\banalytics?\b/.test(normalized)) {
    terms.add("business intelligence");
    terms.add("data analyst");
  }

  if (/\bdata\s+governance\b/.test(normalized)) {
    terms.add("data management");
    terms.add("data quality");
  }

  return Array.from(terms).slice(0, 12);
}

async function getKeywordCategories(query: string) {
  const normalized = normalizeSearchTerm(query);

  if (!normalized) return [];

  const tokens = getSearchTokens(normalized);
  const lookupTerms = Array.from(new Set([normalized, ...tokens])).slice(0, 5);

  if (lookupTerms.length === 0) return [];

  const filter = lookupTerms
    .map((term) => `term.ilike.%${escapeIlikeValue(term)}%`)
    .join(",");

  try {
    const { data, error } = await supabaseAdmin
      .from("keyword_suggestions")
      .select("category")
      .or(filter)
      .not("category", "is", null)
      .limit(10);

    if (error) {
      console.error("[GET /api/jobs] Keyword category lookup failed:", error);
      return [];
    }

    return Array.from(
      new Set(
        (data ?? [])
          .map((row) =>
            typeof row.category === "string" ? row.category.trim() : "",
          )
          .filter(Boolean),
      ),
    );
  } catch (error) {
    console.error("[GET /api/jobs] Keyword category lookup crashed:", error);
    return [];
  }
}

function buildJobSearchFilter(query: string, categories: string[]) {
  const normalized = normalizeSearchTerm(query);

  if (!normalized) return null;

  const terms = expandedSearchTerms(normalized);
  const filters: string[] = [];
  const searchableColumns = [
    "title",
    "company_name",
    "category",
    "location",
    "description",
  ];

  for (const term of terms) {
    const escaped = escapeIlikeValue(term);
    const columns =
      term === normalized ? ["title", ...searchableColumns] : searchableColumns;

    for (const column of columns) {
      filters.push(`${column}.ilike.%${escaped}%`);
    }
  }

  for (const category of categories.slice(0, 3)) {
    filters.push(`category.ilike.%${escapeIlikeValue(category)}%`);
  }

  return Array.from(new Set(filters)).join(",");
}

function expandedSearchRank<
  T extends {
    company_name: string;
    location: string;
    title: string;
    category: string | null;
    posted_at: string;
    skills?: string[] | null;
  },
>(job: T, query: string, categories: string[]) {
  const normalizedQuery = normalizeSearchTerm(query);
  const tokens = getSearchTokens(query);

  if (!normalizedQuery) return 0;

  const title = job.title.toLowerCase();
  const company = job.company_name.toLowerCase();
  const category = job.category?.toLowerCase() ?? "";
  const titleTokenMatches = tokens.filter((token) =>
    title.includes(token),
  ).length;
  const skillsText = Array.isArray(job.skills)
    ? job.skills.join(" ").toLowerCase()
    : "";

  if (title === normalizedQuery) return 0;
  if (title.startsWith(normalizedQuery)) return 1;
  if (title.includes(normalizedQuery)) return 2;
  if (tokens.length > 0 && titleTokenMatches === tokens.length) return 3;
  if (tokens.length > 0 && titleTokenMatches > 0) return 20 - titleTokenMatches;

  if (company.includes(normalizedQuery)) return 40;

  const skillTokenMatches = tokens.filter((token) =>
    skillsText.includes(token),
  ).length;

  if (skillTokenMatches > 0) return 50 - skillTokenMatches;

  const categoryMatchIndex = categories.findIndex((item) =>
    category.includes(item.toLowerCase()),
  );

  if (categoryMatchIndex >= 0) return 70 + categoryMatchIndex;

  if (tokens.some((token) => category.includes(token))) return 80;

  return 100;
}

function titleStronglyMatchesQuery(job: { title: string }, query: string) {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return true;

  const title = normalizeSearchTerm(job.title);
  const tokens = getSearchTokens(normalizedQuery);

  return (
    title.includes(normalizedQuery) ||
    (tokens.length > 0 && tokens.every((token) => title.includes(token)))
  );
}

function jobSearchableText<
  T extends {
    company_name: string;
    location: string;
    title: string;
    category: string | null;
    description?: string | null;
    skills?: string[] | null;
  },
>(job: T) {
  return normalizeSearchTerm(
    [
      job.title,
      job.company_name,
      job.category,
      job.location,
      job.description,
      ...(Array.isArray(job.skills) ? job.skills : []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function jobMatchesExpandedSearch<
  T extends {
    company_name: string;
    location: string;
    title: string;
    category: string | null;
    description?: string | null;
    skills?: string[] | null;
  },
>(job: T, query: string, categories: string[]) {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return true;

  const text = jobSearchableText(job);
  const tokens = getSearchTokens(normalizedQuery);
  const terms = expandedSearchTerms(normalizedQuery);

  if (text.includes(normalizedQuery)) return true;

  if (tokens.length > 0 && tokens.every((token) => text.includes(token))) {
    return true;
  }

  if (terms.some((term) => term.includes(" ") && text.includes(term))) {
    return true;
  }

  return categories.some((category) =>
    text.includes(normalizeSearchTerm(category)),
  );
}

function rankExpandedSearchResults<
  T extends {
    company_name: string;
    location: string;
    title: string;
    category: string | null;
    posted_at: string;
    skills?: string[] | null;
  },
>(jobs: T[], query: string, categories: string[]) {
  if (!query.trim()) return jobs;

  return [...jobs].sort((a, b) => {
    const rankDiff =
      expandedSearchRank(a, query, categories) -
      expandedSearchRank(b, query, categories);

    if (rankDiff !== 0) return rankDiff;

    return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
  });
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

function toJobCandidateRows(rows: DiverseBrowseRpcRow[]) {
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const query = searchParams.get("query") ?? "";
    const location = searchParams.get("location") ?? "";
    const daysAgo = Number(searchParams.get("daysAgo") ?? "3650");
    const safeDaysAgo = Number.isFinite(daysAgo) ? daysAgo : 3650;
    const distance = searchParams.get("distance") ?? "";
    const workMode = searchParams.get("workMode") ?? "";
    const employmentType = searchParams.get("employmentType") ?? "";
    const category = searchParams.get("category") ?? "";
    const company = searchParams.get("company") ?? "";
    const excludeId = searchParams.get("excludeId") ?? "";
    const balance = searchParams.get("balance") ?? DEFAULT_COMPANY_BALANCE;
    const loadMode = searchParams.get("loadMode") ?? "pool";
    const seed = searchParams.get("seed") ?? defaultBrowseSeed();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      25,
      Math.max(1, Number(searchParams.get("pageSize") ?? "20")),
    );

    const shouldUseDiverseBrowse =
      loadMode === "diverse" &&
      !query.trim() &&
      !workMode &&
      !employmentType &&
      !category &&
      !company.trim() &&
      !excludeId;

    const shouldUseKeywordSearchRpc =
      loadMode === "pool" &&
      query.trim().length > 0 &&
      !workMode &&
      !employmentType &&
      !category &&
      !company.trim() &&
      !excludeId;

    if (shouldUseDiverseBrowse) {
      const cacheKey = getJobsApiCacheKey({
        mode: "browse",
        query,
        location,
        daysAgo: safeDaysAgo,
        page,
        pageSize,
        distance,
      });

      const cached = await readJobsCache(cacheKey);

      if (cached) {
        return jobsJsonResponse(cached, JOBS_BROWSE_CACHE_TTL_SECONDS);
      }

      const { data: diverseRows, error: diverseError } =
        await supabaseAdmin.rpc("search_jobs_diverse_browse", {
          p_days_ago: safeDaysAgo,
          p_location: location.trim() || null,
          p_page: page,
          p_page_size: pageSize,
        });

      if (diverseError) {
        console.error(
          "[GET /api/jobs] search_jobs_diverse_browse failed:",
          diverseError,
        );

        return NextResponse.json(
          {
            error: "Failed to load jobs.",
            details: diverseError,
          },
          { status: 500 },
        );
      }

      const rows = (diverseRows ?? []) as DiverseBrowseRpcRow[];
      const total = toCount(rows[0]?.total_count);
      const newJobs = toCount(rows[0]?.new_jobs_count);
      const pageCandidates = toJobCandidateRows(rows);
      const pageJobs = await hydrateJobDetails(pageCandidates);

      const payload: JobsApiPayload = {
        data: pageJobs,
        total,
        newJobs,
        newJobsWindowDays: NEW_JOBS_WINDOW_DAYS,
        balance: "company",
        seed: null,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };

      await writeJobsCache(cacheKey, payload, JOBS_BROWSE_CACHE_TTL_SECONDS);

      return jobsJsonResponse(payload, JOBS_BROWSE_CACHE_TTL_SECONDS);
    }

    if (shouldUseKeywordSearchRpc) {
      const cacheKey = getJobsApiCacheKey({
        mode: "keyword",
        query,
        location,
        daysAgo: safeDaysAgo,
        page,
        pageSize,
        distance,
      });

      const cached = await readJobsCache(cacheKey);

      if (cached) {
        return jobsJsonResponse(cached, JOBS_KEYWORD_CACHE_TTL_SECONDS);
      }

      const { data: keywordRows, error: keywordError } =
        await supabaseAdmin.rpc("search_jobs_keyword_diverse", {
          p_query: query.trim(),
          p_days_ago: safeDaysAgo,
          p_location: location.trim() || null,
          p_page: page,
          p_page_size: pageSize,
        });

      if (keywordError) {
        console.error(
          "[GET /api/jobs] search_jobs_keyword_diverse failed:",
          keywordError,
        );

        return NextResponse.json(
          {
            error: "Failed to search jobs.",
            details: keywordError,
          },
          { status: 500 },
        );
      }

      const rows = (keywordRows ?? []) as DiverseBrowseRpcRow[];
      const total = toCount(rows[0]?.total_count);
      const newJobs = toCount(rows[0]?.new_jobs_count);
      const pageCandidates = toJobCandidateRows(rows);
      const pageJobs = await hydrateJobDetails(pageCandidates);

      const payload: JobsApiPayload = {
        data: pageJobs,
        total,
        newJobs,
        newJobsWindowDays: NEW_JOBS_WINDOW_DAYS,
        balance: "company",
        seed: null,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };

      await writeJobsCache(cacheKey, payload, JOBS_KEYWORD_CACHE_TTL_SECONDS);

      return jobsJsonResponse(payload, JOBS_KEYWORD_CACHE_TTL_SECONDS);
    }

    const keywordCategories = await getKeywordCategories(query);

    const shouldBalanceByCompany = shouldBalanceCompanyResults({
      query,
      location,
      workMode,
      employmentType,
      category,
      company,
      excludeId,
      balance,
    });
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const shouldUseDatabasePage =
      loadMode === "page" && !shouldBalanceByCompany && !query.trim();
    const candidateLimit = candidateLimitForRequest({
      page,
      pageSize,
      shouldBalanceByCompany,
    });

    let dbQuery = supabaseAdmin
      .from("jobs")
      .select(JOB_CANDIDATE_SELECT, { count: "exact" })
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .gte(
        "posted_at",
        new Date(Date.now() - safeDaysAgo * 86_400_000).toISOString(),
      )
      .order("posted_at", { ascending: false });

    if (query.trim()) {
      const keywordFilter = buildJobSearchFilter(query, keywordCategories);

      if (keywordFilter) {
        dbQuery = dbQuery.or(keywordFilter);
      }
    }

    if (location.trim()) {
      const loc = locationSearchTerm(location);

      if (loc) {
        dbQuery = dbQuery.ilike("location", `%${loc}%`);
      }
    }

    if (workMode) {
      dbQuery = dbQuery.eq("work_mode", workMode);
    }

    if (employmentType) {
      dbQuery = dbQuery.eq("employment_type", employmentType);
    }

    if (category) {
      dbQuery = dbQuery.eq("category", category);
    }

    if (company.trim()) {
      dbQuery = dbQuery.eq("company_name", company.trim());
    }

    if (excludeId) {
      dbQuery = dbQuery.neq("id", excludeId);
    }

    if (shouldUseDatabasePage) {
      dbQuery = dbQuery.range(from, to - 1);
    } else {
      dbQuery = dbQuery.limit(candidateLimit);
    }

    const { count, data, error } = await dbQuery;

    if (error) {
      console.error("[GET /api/jobs] Supabase error:", error);

      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 500 },
      );
    }

    const candidateJobs = (data ?? []) as JobCandidateRow[];
    const filteredCandidateJobs = query.trim()
      ? candidateJobs.filter((job) =>
          jobMatchesExpandedSearch(job, query, keywordCategories),
        )
      : candidateJobs;

    const broadBrowseCandidates = shouldBalanceByCompany
      ? rotateBroadBrowseJobs(filteredCandidateJobs, seed)
      : filteredCandidateJobs;

    const rankedCandidates = rankExpandedSearchResults(
      filteredCandidateJobs,
      query,
      keywordCategories,
    );
    const displayCandidates = shouldBalanceByCompany
      ? balanceJobsByCompany(broadBrowseCandidates)
      : query.trim()
        ? [
            ...rankedCandidates.filter((job) =>
              titleStronglyMatchesQuery(job, query),
            ),
            ...balanceJobsByCompany(
              rankedCandidates.filter(
                (job) => !titleStronglyMatchesQuery(job, query),
              ),
            ),
          ]
        : rankedCandidates;

    const total = query.trim()
      ? displayCandidates.length
      : (count ?? displayCandidates.length);
    let newJobs = displayCandidates.filter((job) => {
      const postedTime = new Date(job.posted_at).getTime();

      if (Number.isNaN(postedTime)) return false;

      return postedTime >= Date.now() - NEW_JOBS_WINDOW_DAYS * 86_400_000;
    }).length;

    if (loadMode === "page") {
      const loc = locationSearchTerm(location);
      const newestAllowedDate = new Date(
        Math.max(
          Date.now() - safeDaysAgo * 86_400_000,
          Date.now() - NEW_JOBS_WINDOW_DAYS * 86_400_000,
        ),
      ).toISOString();
      let newJobsQuery = supabaseAdmin
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .gte("posted_at", newestAllowedDate);

      if (loc) {
        newJobsQuery = newJobsQuery.ilike("location", `%${loc}%`);
      }

      const { count: newJobsCount, error: newJobsError } = await newJobsQuery;

      if (!newJobsError) {
        newJobs = newJobsCount ?? 0;
      }
    }

    const pageCandidates = shouldUseDatabasePage
      ? displayCandidates
      : displayCandidates.slice(from, to);
    const pageJobs = await hydrateJobDetails(pageCandidates);

    return NextResponse.json({
      data: pageJobs,
      total,
      newJobs,
      newJobsWindowDays: NEW_JOBS_WINDOW_DAYS,
      balance: shouldBalanceByCompany ? "company" : "none",
      seed: shouldBalanceByCompany ? seed : null,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
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
