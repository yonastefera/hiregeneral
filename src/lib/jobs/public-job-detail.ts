import "server-only";

import type { Job } from "@/lib/db/types";
import { JOB_ENRICHMENT_SELECT, mapJobEnrichment } from "@/lib/jobs/enrichment";
import { logServerError } from "@/lib/http/api-security";
import { redis } from "@/lib/rate-limit";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { cleanTextArray, htmlToText } from "@/lib/text/html";

const supabasePublic = createSupabasePublicClient();
const CACHE_TTL_SECONDS = 60 * 60;
const CACHE_VERSION = process.env.JOB_DETAIL_CACHE_VERSION ?? "3";
const SHOULD_CACHE =
  process.env.NODE_ENV === "production" &&
  process.env.JOB_DETAIL_CACHE_DISABLED !== "1";

const JOB_DETAIL_SELECT = `
  id, recruiter_id, company_id, company_name, company_logo_url,
  company_tagline, company_size, company_website, title, description,
  responsibilities, requirements, benefits, location, latitude, longitude,
  employment_type, work_mode, experience_level, category, salary_min,
  salary_max, salary_currency, skills, status, slug, apply_url, source_name,
  source_id, posted_at, expires_at, created_at, updated_at,
  job_applicant_counts ( applicant_count )
`;

const RELATED_JOB_SELECT = `
  id, recruiter_id, company_id, company_name, company_logo_url,
  company_tagline, company_size, company_website, title, description,
  responsibilities, requirements, benefits, location, latitude, longitude,
  employment_type, work_mode, experience_level, category, salary_min,
  salary_max, salary_currency, skills, status, slug, apply_url, source_name,
  source_id, posted_at, expires_at, created_at, updated_at
`;

type JobRow = Job & {
  job_applicant_counts?: Array<{ applicant_count: number | null }> | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function cacheKey(jobId: string) {
  return `job-detail:${CACHE_VERSION}:${jobId.toLowerCase()}`;
}

function publishedJobs(now = new Date().toISOString()) {
  return supabasePublic
    .from("jobs")
    .select(JOB_DETAIL_SELECT)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${now}`);
}

async function findJob(jobId: string) {
  let query = publishedJobs();
  query = isUuid(jobId)
    ? query.or(`slug.eq.${jobId},id.eq.${jobId}`)
    : query.eq("slug", jobId);

  const result = await query.maybeSingle();
  if (result.error)
    throw new Error(`Could not load job: ${result.error.message}`);
  if (result.data) return result.data as JobRow;

  const legacyId = isUuid(jobId) ? null : jobId.match(/-(\d{3,})$/)?.[1];
  if (!legacyId) return null;

  const legacy = await publishedJobs()
    .or(
      `source_id.eq.${legacyId},source_id.ilike.*:${legacyId},source_id.ilike.*-${legacyId},source_id.ilike.*/${legacyId}`,
    )
    .order("updated_at", { ascending: false })
    .limit(1);
  if (legacy.error) {
    throw new Error(`Could not load legacy job: ${legacy.error.message}`);
  }
  return (legacy.data?.[0] as JobRow | undefined) ?? null;
}

async function loadEnrichment(jobId: string) {
  const { data, error } = await supabasePublic
    .from("job_enrichments")
    .select(JOB_ENRICHMENT_SELECT)
    .eq("job_id", jobId)
    .eq("status", "ready")
    .maybeSingle();
  if (error && error.code !== "42P01") {
    throw new Error(`Could not load job enrichment: ${error.message}`);
  }
  return mapJobEnrichment(data);
}

function cleanJobRow(row: JobRow, enrichment: Job["enrichment"]): Job {
  const { job_applicant_counts, ...job } = row;
  return {
    ...job,
    title: htmlToText(job.title),
    company_tagline: job.company_tagline
      ? htmlToText(job.company_tagline)
      : null,
    responsibilities: cleanTextArray(job.responsibilities),
    requirements: cleanTextArray(job.requirements),
    benefits: cleanTextArray(job.benefits),
    skills: job.skills ?? [],
    applicant_count: job_applicant_counts?.[0]?.applicant_count ?? 0,
    enrichment,
  };
}

export async function loadPublicJobDetail(jobId: string): Promise<Job | null> {
  const key = cacheKey(jobId);
  if (SHOULD_CACHE) {
    try {
      const cached = await redis.get<Job>(key);
      if (cached) return cached;
    } catch (error) {
      logServerError("job_detail_cache_read_failed", error);
    }
  }

  const row = await findJob(jobId);
  if (!row) return null;
  const payload = cleanJobRow(row, await loadEnrichment(row.id));

  if (SHOULD_CACHE) {
    try {
      await redis.set(key, payload, { ex: CACHE_TTL_SECONDS });
    } catch (error) {
      logServerError("job_detail_cache_write_failed", error);
    }
  }
  return payload;
}

export async function loadRelatedPublicJobs(job: Job): Promise<Job[]> {
  const now = new Date().toISOString();
  let query = supabasePublic
    .from("jobs")
    .select(RELATED_JOB_SELECT)
    .eq("status", "published")
    .neq("id", job.id)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("posted_at", { ascending: false })
    .limit(3);

  query = job.category
    ? query.eq("category", job.category)
    : query.eq("company_name", job.company_name);

  const { data, error } = await query;
  if (error) {
    logServerError("related_jobs_query_failed", error);
    return [];
  }
  return ((data ?? []) as Job[]).map((related) =>
    cleanJobRow(related, related.enrichment ?? null),
  );
}
