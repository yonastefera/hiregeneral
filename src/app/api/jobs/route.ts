// app/api/jobs/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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

type JobResponse = Omit<JobRow, "job_applicant_counts"> & {
  applicant_count: number;
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = req.nextUrl;

  const query = searchParams.get("query") ?? "";
  const location = searchParams.get("location") ?? "";
  const daysAgo = Number(searchParams.get("daysAgo") ?? "30");
  const workMode = searchParams.get("workMode") ?? "";
  const employmentType = searchParams.get("employmentType") ?? "";
  const category = searchParams.get("category") ?? "";
  const excludeId = searchParams.get("excludeId") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Number(searchParams.get("pageSize") ?? "20"));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dbQuery = supabase
    .from("jobs")
    .select(
      `
      id, recruiter_id, company_id,
      company_name, company_logo_url, company_tagline, company_size, company_website,
      title, description, responsibilities, requirements, benefits,
      location, latitude, longitude,
      employment_type, work_mode, experience_level, category,
      salary_min, salary_max, salary_currency, skills,
      status, slug, apply_url, source_name, source_id,
      posted_at, expires_at, created_at, updated_at,
      job_applicant_counts ( applicant_count )
    `,
      { count: "exact" },
    )
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .gte("posted_at", new Date(Date.now() - daysAgo * 86_400_000).toISOString())
    .order("posted_at", { ascending: false })
    .range(from, to);

  if (query.trim()) {
    dbQuery = dbQuery.textSearch(
      "title,company_name,description,location",
      query.trim(),
      { type: "websearch", config: "english" },
    );
  }

  if (location.trim()) {
    dbQuery = dbQuery.ilike("location", `%${location.trim()}%`);
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

  const { data, error, count } = await dbQuery;

  if (error) {
    console.error("[GET /api/jobs]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const jobs: JobResponse[] = ((data ?? []) as JobRow[]).map(
    ({ job_applicant_counts, ...job }) => ({
      ...job,
      applicant_count: job_applicant_counts?.[0]?.applicant_count ?? 0,
    }),
  );

  return NextResponse.json({
    data: jobs,
    total: count ?? 0,
    page,
    pageSize,
  });
}
