// app/api/jobs/[slug]/route.ts
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
  company_tagline: string | null;
  company_size: string | null;
  company_website: string | null;
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  location: string;
  employment_type: string;
  work_mode: string;
  experience_level: string | null;
  category: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  skills: string[];
  status: string;
  slug: string | null;
  apply_url: string | null;
  source_name: string | null;
  posted_at: string;
  expires_at: string | null;
  job_applicant_counts?: JobApplicantCountRow[] | null;
};

type JobResponse = Omit<JobRow, "job_applicant_counts"> & {
  applicant_count: number;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id, recruiter_id, company_id,
      company_name, company_logo_url, company_tagline, company_size, company_website,
      title, description, responsibilities, requirements, benefits,
      location, employment_type, work_mode, experience_level, category,
      salary_min, salary_max, salary_currency, skills,
      status, slug, apply_url, source_name,
      posted_at, expires_at,
      job_applicant_counts ( applicant_count )
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { job_applicant_counts, ...jobData } = data as JobRow;

  const job: JobResponse = {
    ...jobData,
    applicant_count: job_applicant_counts?.[0]?.applicant_count ?? 0,
  };

  return NextResponse.json(job);
}
