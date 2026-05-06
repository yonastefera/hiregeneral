// app/api/jobs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
};

type JobResponse = JobRow & {
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

function isNorthAmericaLocation(location: string | null | undefined) {
  if (!location) return false;

  const value = location.toLowerCase();

  const excluded = [
    "london",
    "united kingdom",
    "uk",
    "ireland",
    "germany",
    "france",
    "spain",
    "italy",
    "netherlands",
    "sweden",
    "poland",
    "romania",
    "europe",
    "emea",
    "india",
    "bengaluru",
    "bangalore",
    "singapore",
    "japan",
    "tokyo",
    "australia",
    "sydney",
    "melbourne",
    "new zealand",
    "brazil",
    "argentina",
  ];

  if (excluded.some((term) => value.includes(term))) {
    return false;
  }

  const included = [
    "remote",
    "united states",
    "usa",
    "u.s.",
    "us",
    "canada",
    "mexico",
    "north america",
    "san francisco",
    "new york",
    "nyc",
    "seattle",
    "chicago",
    "austin",
    "boston",
    "atlanta",
    "miami",
    "denver",
    "dallas",
    "los angeles",
    "la ",
    "california",
    "texas",
    "washington",
    "oregon",
    "colorado",
    "florida",
    "georgia",
    "illinois",
    "massachusetts",
    "toronto",
    "vancouver",
    "montreal",
  ];

  return included.some((term) => value.includes(term));
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
    const excludeId = searchParams.get("excludeId") ?? "";

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(25, Number(searchParams.get("pageSize") ?? "10"));

    // Fetch a larger candidate set, then filter North America in JS.
    // Later, add location_country/location_region columns and move this into SQL.
    let dbQuery = supabaseAdmin
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
        updated_at
      `,
        { count: "exact" },
      )
      .eq("status", "published")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .gte(
        "posted_at",
        new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      )
      .order("posted_at", { ascending: false })
      .limit(1000);

    if (query.trim()) {
      const q = `%${query.trim()}%`;

      dbQuery = dbQuery.or(
        `title.ilike.${q},company_name.ilike.${q},description.ilike.${q},location.ilike.${q},category.ilike.${q}`,
      );
    }

    if (location.trim()) {
      const loc = `%${location.trim()}%`;

      dbQuery = dbQuery.or(`location.ilike.${loc},work_mode.ilike.${loc}`);
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

    if (excludeId) {
      dbQuery = dbQuery.neq("id", excludeId);
    }

    const { data, error } = await dbQuery;

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

    const cleanedJobs: JobResponse[] = ((data ?? []) as JobRow[])
      .filter((job) => isNorthAmericaLocation(job.location))
      .map((job) => ({
        ...job,
        description: stripHtml(job.description),
        applicant_count: 0,
      }));

    const total = cleanedJobs.length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;

    return NextResponse.json({
      data: cleanedJobs.slice(from, to),
      total,
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
