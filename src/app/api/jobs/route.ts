import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
  "description" | "responsibilities" | "requirements" | "benefits"
>;

type JobDetailRow = Pick<
  JobRow,
  "id" | "description" | "responsibilities" | "requirements" | "benefits"
>;

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

  const tokens = getSearchTokens(normalized);
  const filters: string[] = [];

  filters.push(`search_text.ilike.%${escapeIlikeValue(normalized)}%`);

  for (const token of tokens) {
    filters.push(`search_text.ilike.%${escapeIlikeValue(token)}%`);
  }

  for (const category of categories.slice(0, 3)) {
    filters.push(`category.ilike.%${escapeIlikeValue(category)}%`);
  }

  return Array.from(new Set(filters)).join(",");
}

function expandedSearchRank<
  T extends {
    company_name: string;
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
  const skillsText = Array.isArray(job.skills)
    ? job.skills.join(" ").toLowerCase()
    : "";

  if (title === normalizedQuery) return 0;
  if (title.startsWith(normalizedQuery)) return 1;
  if (title.includes(normalizedQuery)) return 2;

  const titleTokenMatches = tokens.filter((token) =>
    title.includes(token),
  ).length;

  if (tokens.length > 0 && titleTokenMatches === tokens.length) return 3;
  if (titleTokenMatches > 0) return 10 - titleTokenMatches;

  if (company.includes(normalizedQuery)) return 20;

  const skillTokenMatches = tokens.filter((token) =>
    skillsText.includes(token),
  ).length;

  if (skillTokenMatches > 0) return 30 - skillTokenMatches;

  const categoryMatchIndex = categories.findIndex((item) =>
    category.includes(item.toLowerCase()),
  );

  if (categoryMatchIndex >= 0) return 50 + categoryMatchIndex;

  if (tokens.some((token) => category.includes(token))) return 60;

  return 100;
}

function rankExpandedSearchResults<
  T extends {
    company_name: string;
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
      description: stripHtml(details?.description),
      responsibilities: details?.responsibilities ?? [],
      requirements: details?.requirements ?? [],
      benefits: details?.benefits ?? [],
      applicant_count: job.job_applicant_counts?.[0]?.applicant_count ?? 0,
      enrichment: enrichmentsByJobId.get(job.id) ?? null,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const query = searchParams.get("query") ?? "";
    const location = searchParams.get("location") ?? "";
    const daysAgo = Number(searchParams.get("daysAgo") ?? "3650");
    const workMode = searchParams.get("workMode") ?? "";
    const employmentType = searchParams.get("employmentType") ?? "";
    const category = searchParams.get("category") ?? "";
    const company = searchParams.get("company") ?? "";
    const excludeId = searchParams.get("excludeId") ?? "";
    const balance = searchParams.get("balance") ?? DEFAULT_COMPANY_BALANCE;
    const loadMode = searchParams.get("loadMode") ?? "pool";
    const seed = searchParams.get("seed") ?? defaultBrowseSeed();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(25, Number(searchParams.get("pageSize") ?? "10"));
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
      loadMode === "page" && !shouldBalanceByCompany;
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
        new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
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

    const broadBrowseCandidates = shouldBalanceByCompany
      ? rotateBroadBrowseJobs(candidateJobs, seed)
      : candidateJobs;

    const displayCandidates = shouldBalanceByCompany
      ? balanceJobsByCompany(broadBrowseCandidates)
      : rankExpandedSearchResults(candidateJobs, query, keywordCategories);

    const total = count ?? displayCandidates.length;
    let newJobs = displayCandidates.filter((job) => {
      const postedTime = new Date(job.posted_at).getTime();

      if (Number.isNaN(postedTime)) return false;

      return postedTime >= Date.now() - NEW_JOBS_WINDOW_DAYS * 86_400_000;
    }).length;

    if (loadMode === "page") {
      const loc = locationSearchTerm(location);
      const newestAllowedDate = new Date(
        Math.max(
          Date.now() - daysAgo * 86_400_000,
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
