import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { redis } from "@/lib/rate-limit";
import { htmlToText, cleanTextArray } from "@/lib/text/html";
import { JOB_ENRICHMENT_SELECT, mapJobEnrichment } from "@/lib/jobs/enrichment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const JOB_DETAIL_CACHE_TTL_SECONDS = 60 * 10; // 10 minutes
const JOB_DETAIL_CACHE_VERSION = process.env.JOB_DETAIL_CACHE_VERSION ?? "2";
const SHOULD_CACHE_JOB_DETAILS =
  process.env.NODE_ENV === "production" &&
  process.env.JOB_DETAIL_CACHE_DISABLED !== "1";

type JobApplicantCountRow = {
  applicant_count: number | null;
};

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
  job_applicant_counts?: JobApplicantCountRow[] | null;
};

type JobDetailPayload = Omit<JobRow, "job_applicant_counts"> & {
  title: string;
  description: string;
  company_tagline: string | null;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  applicant_count: number;
  enrichment: ReturnType<typeof mapJobEnrichment>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getJobDetailCacheKey(slug: string) {
  return `job-detail:${JOB_DETAIL_CACHE_VERSION}:${slug.toLowerCase()}`;
}

function jsonResponse(payload: JobDetailPayload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

async function loadJobEnrichment(jobId: string) {
  const { data, error } = await supabaseAdmin
    .from("job_enrichments")
    .select(JOB_ENRICHMENT_SELECT)
    .eq("job_id", jobId)
    .eq("status", "ready")
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return null;

    throw new Error(`Could not load job enrichment: ${error.message}`);
  }

  return mapJobEnrichment(data);
}

async function cleanJob(job: JobRow): Promise<JobDetailPayload> {
  const { job_applicant_counts, ...rest } = job;
  const enrichment = await loadJobEnrichment(rest.id);

  return {
    ...rest,
    title: htmlToText(rest.title),
    description: rest.description,
    company_tagline: rest.company_tagline
      ? htmlToText(rest.company_tagline)
      : rest.company_tagline,
    responsibilities: cleanTextArray(rest.responsibilities),
    requirements: cleanTextArray(rest.requirements),
    benefits: cleanTextArray(rest.benefits),
    skills: rest.skills ?? [],
    applicant_count: job_applicant_counts?.[0]?.applicant_count ?? 0,
    enrichment,
  };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const normalizedSlug = slug?.trim();

    if (!normalizedSlug) {
      return NextResponse.json({ error: "Missing job slug" }, { status: 400 });
    }

    const cacheKey = getJobDetailCacheKey(normalizedSlug);

    if (SHOULD_CACHE_JOB_DETAILS) {
      try {
        const cached = await redis.get<JobDetailPayload>(cacheKey);

        if (cached) {
          return jsonResponse(cached);
        }
      } catch (error) {
        console.error("[GET /api/jobs/[slug]] Redis read failed:", error);
      }
    }

    let query = supabaseAdmin
      .from("jobs")
      .select(
        `
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
        responsibilities,
        requirements,
        benefits,
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
      `,
      )
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    query = isUuid(normalizedSlug)
      ? query.or(`slug.eq.${normalizedSlug},id.eq.${normalizedSlug}`)
      : query.eq("slug", normalizedSlug);

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("[GET /api/jobs/[slug]] Supabase error:", error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Job not found" },
        {
          status: 404,
          headers: {
            // Briefly cache 404s to reduce repeated misses, but not too long.
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        },
      );
    }

    const payload = await cleanJob(data as JobRow);

    if (SHOULD_CACHE_JOB_DETAILS) {
      try {
        await redis.set(cacheKey, payload, {
          ex: JOB_DETAIL_CACHE_TTL_SECONDS,
        });
      } catch (error) {
        console.error("[GET /api/jobs/[slug]] Redis write failed:", error);
      }
    }

    return jsonResponse(payload);
  } catch (error) {
    console.error("[GET /api/jobs/[slug]] Fatal error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}
