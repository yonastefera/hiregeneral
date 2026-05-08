// app/api/jobs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const MAX_CANDIDATE_JOBS = 5000;
const NEW_JOBS_WINDOW_DAYS = 7;
const DEFAULT_COMPANY_BALANCE = "company";

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

type JobResponse = JobCandidateRow &
  JobDetailRow & {
  applicant_count: number;
};

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

function searchRank<T extends { company_name: string; title: string; category: string | null }>(
  job: T,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return 0;

  const company = job.company_name.toLowerCase();
  const title = job.title.toLowerCase();
  const category = job.category?.toLowerCase() ?? "";

  if (company === normalizedQuery) return 0;
  if (company.includes(normalizedQuery)) return 1;
  if (title === normalizedQuery) return 2;
  if (title.includes(normalizedQuery)) return 3;
  if (category.includes(normalizedQuery)) return 4;

  return 5;
}

function rankSearchResults<
  T extends {
    company_name: string;
    title: string;
    category: string | null;
    posted_at: string;
  },
>(jobs: T[], query: string) {
  if (!query.trim()) return jobs;

  return [...jobs].sort((a, b) => {
    const rankDiff = searchRank(a, query) - searchRank(b, query);

    if (rankDiff !== 0) return rankDiff;

    return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
  });
}

function hasSearchIntent(params: {
  query: string;
  location: string;
  workMode: string;
  employmentType: string;
  category: string;
  company: string;
  excludeId: string;
}) {
  return Boolean(
    params.query.trim() ||
      params.location.trim() ||
      params.workMode ||
      params.employmentType ||
      params.category ||
      params.company.trim() ||
      params.excludeId,
  );
}

function locationSearchTerm(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .find(Boolean);
}

async function hydrateJobDetails(candidates: JobCandidateRow[]) {
  if (candidates.length === 0) return [];

  const ids = candidates.map((job) => job.id);
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(JOB_DETAIL_SELECT)
    .in("id", ids);

  if (error) {
    throw new Error(`Could not load job details: ${error.message}`);
  }

  const detailsById = new Map(
    ((data ?? []) as JobDetailRow[]).map((job) => [job.id, job]),
  );

  return candidates.map((job) => {
    const details = detailsById.get(job.id);

    return {
      ...job,
      description: stripHtml(details?.description),
      responsibilities: details?.responsibilities ?? [],
      requirements: details?.requirements ?? [],
      benefits: details?.benefits ?? [],
      applicant_count: job.job_applicant_counts?.[0]?.applicant_count ?? 0,
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
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(25, Number(searchParams.get("pageSize") ?? "10"));

    // Fetch a lightweight candidate set, then hydrate only the jobs returned on
    // this page. This keeps tiny dashboard requests from downloading every full
    // job description in the table.
    let dbQuery = supabaseAdmin
      .from("jobs")
      .select(JOB_CANDIDATE_SELECT, { count: "exact" })
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .gte(
        "posted_at",
        new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      )
      .order("posted_at", { ascending: false })
      .limit(MAX_CANDIDATE_JOBS);

    if (query.trim()) {
      const q = `%${query.trim()}%`;

      dbQuery = dbQuery.or(
        `title.ilike.${q},company_name.ilike.${q},description.ilike.${q},location.ilike.${q},category.ilike.${q}`,
      );
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

    const shouldBalanceByCompany =
      balance === "company" &&
      !hasSearchIntent({
        query,
        location,
        workMode,
        employmentType,
        category,
        company,
        excludeId,
      });
    const displayCandidates = shouldBalanceByCompany
      ? balanceJobsByCompany(candidateJobs)
      : rankSearchResults(candidateJobs, query);

    const total = count ?? displayCandidates.length;
    const newJobs = displayCandidates.filter((job) => {
      const postedTime = new Date(job.posted_at).getTime();

      if (Number.isNaN(postedTime)) return false;

      return (
        postedTime >=
        Date.now() - NEW_JOBS_WINDOW_DAYS * 86_400_000
      );
    }).length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const pageJobs = await hydrateJobDetails(displayCandidates.slice(from, to));

    return NextResponse.json({
      data: pageJobs,
      total,
      newJobs,
      newJobsWindowDays: NEW_JOBS_WINDOW_DAYS,
      balance: shouldBalanceByCompany ? "company" : "none",
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
