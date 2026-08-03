import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  entitlementDenied,
  loadEmployerEntitlements,
} from "@/lib/billing/entitlements";
import {
  boundedJsonBody,
  enforceRateLimit,
  JSON_BODY_LIMITS,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { slugify } from "@/lib/ingest/normalize";
import { employerJobRateLimit } from "@/lib/rate-limit";
import { getEmployerJobsPage } from "@/employer/dashboard/jobs/employer-jobs-data";

export const runtime = "nodejs";

const jobStatusSchema = z.enum(["draft", "published"]);
const boostSchema = z.enum(["none", "3", "5", "10", "20"]);

const screeningQuestionSchema = z.object({
  id: z.string().trim().min(1),
  question: z.string().trim().min(3).max(240),
  required: z.boolean().default(true),
});

const postJobSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Job title is required."),
  companyName: z.string().trim().min(2, "Hiring company is required."),
  location: z.string().trim().min(2, "Job location is required."),
  streetAddress: z.string().trim().optional().default(""),
  remote: z.enum(["yes", "no"]).default("no"),
  distance: z.coerce.number().int().min(10).max(200).default(50),
  includeRelocation: z.boolean().default(true),
  employmentType: z.string().trim().min(1).default("Full-time"),
  description: z.string().trim().min(20, "Add a little more job detail."),
  skills: z.string().trim().optional().default(""),
  benefits: z.array(z.string().trim().min(1)).default([]),
  salaryMin: z.coerce.number().int().nonnegative().nullable().default(null),
  salaryMax: z.coerce.number().int().nonnegative().nullable().default(null),
  salaryCurrency: z.string().trim().length(3).default("USD"),
  payFrequency: z.string().trim().min(1).default("Per year"),
  boostId: boostSchema.default("none"),
  notificationEmail: z.string().trim().email().optional().or(z.literal("")),
  screeningQuestions: z.array(screeningQuestionSchema).max(12).default([]),
  status: jobStatusSchema.default("published"),
});

function cleanNullableNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}

function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getWorkMode(remote: "yes" | "no") {
  return remote === "yes" ? "Remote" : "On-site";
}

function defaultExpiryDate(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function createJobSlug(companyName: string, title: string) {
  const readable = slugify(`${companyName}-${title}`);
  const suffix = crypto.randomUUID().slice(0, 8);

  return `${readable}-${suffix}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const result = await getEmployerJobsPage({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    query: searchParams.get("query"),
    status: searchParams.get("status"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limited = await enforceRateLimit({
    limiter: employerJobRateLimit,
    key: auth.user.id,
    context: "employer_job_create",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request, JSON_BODY_LIMITS.job);
  if (!body.ok) return body.response;
  const rawBody = body.data as Record<string, unknown>;

  const parsed = postJobSchema.safeParse({
    ...rawBody,
    salaryMin: cleanNullableNumber(rawBody?.salaryMin),
    salaryMax: cleanNullableNumber(rawBody?.salaryMax),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the job details.",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (
    payload.salaryMin !== null &&
    payload.salaryMax !== null &&
    payload.salaryMin > payload.salaryMax
  ) {
    return NextResponse.json(
      { error: "Minimum salary cannot be greater than maximum salary." },
      { status: 400 },
    );
  }

  const { supabase, user } = auth;

  const { data: existingCompany, error: companyLookupError } = await supabase
    .from("companies")
    .select("id, logo_url, website")
    .eq("owner_id", user.id)
    .eq("name", payload.companyName)
    .maybeSingle();

  if (companyLookupError) {
    logServerError("employer_job_company_lookup_failed", companyLookupError);
    return safeServerError("Could not create the job.");
  }

  let company = existingCompany;

  if (!company) {
    const { data: createdCompany, error: createCompanyError } = await supabase
      .from("companies")
      .insert({
        owner_id: user.id,
        name: payload.companyName,
        location: payload.location,
      })
      .select("id, logo_url, website")
      .single();

    if (createCompanyError) {
      logServerError("employer_job_company_create_failed", createCompanyError);
      return safeServerError("Could not create the job.");
    }

    company = createdCompany;
  }

  try {
    const entitlements = await loadEmployerEntitlements(supabase);
    if (
      payload.status === "published" &&
      entitlements.activeJobs >= entitlements.activeJobLimit
    ) {
      return entitlementDenied("Your active job limit has been reached.");
    }
    if (payload.boostId !== "none" && entitlements.boostCredits < 1) {
      return entitlementDenied(
        "A boost credit is required for this placement.",
      );
    }
  } catch (error) {
    logServerError("employer_job_entitlement_load_failed", error);
    return safeServerError("Could not create the job.");
  }

  const skills = splitCommaList(payload.skills);
  const responsibilities = payload.description
    .split(/\n+/)
    .map((item) => item.trim().replace(/^[-*•]\s*/, ""))
    .filter((item) => item.length > 12)
    .slice(0, 8);

  const jobValues = {
    recruiter_id: user.id,
    company_id: company?.id ?? null,
    company_name: payload.companyName,
    company_logo_url: company?.logo_url ?? null,
    company_website: company?.website ?? null,
    title: payload.title,
    slug: createJobSlug(payload.companyName, payload.title),
    description: payload.description,
    location: payload.location,
    street_address: payload.streetAddress || null,
    employment_type: payload.employmentType,
    work_mode: getWorkMode(payload.remote),
    applicant_distance_miles: payload.distance,
    include_relocation: payload.includeRelocation,
    salary_min: payload.salaryMin,
    salary_max: payload.salaryMax,
    salary_currency: payload.salaryCurrency,
    salary_frequency: payload.payFrequency,
    skills,
    responsibilities,
    benefits: payload.benefits.includes("None") ? [] : payload.benefits,
    boost_id: payload.boostId,
    notification_email: payload.notificationEmail || null,
    screening_questions: payload.screeningQuestions,
    status: payload.status,
    posted_at: new Date().toISOString(),
    expires_at: payload.status === "published" ? defaultExpiryDate(30) : null,
    source_name: null,
    source_id: null,
    apply_url: null,
    category: skills[0] ?? null,
  };

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert(jobValues)
    .select("id, slug, status, title, company_name, created_at")
    .single();

  if (jobError) {
    if (jobError.code === "P0001") {
      return entitlementDenied("Your job or boost entitlement is unavailable.");
    }
    logServerError("employer_job_create_failed", jobError);
    return safeServerError("Could not create the job.");
  }

  return NextResponse.json({ job }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limited = await enforceRateLimit({
    limiter: employerJobRateLimit,
    key: auth.user.id,
    context: "employer_job_update",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request, JSON_BODY_LIMITS.job);
  if (!body.ok) return body.response;
  const rawBody = body.data as Record<string, unknown>;
  const parsed = postJobSchema.safeParse({
    ...rawBody,
    salaryMin: cleanNullableNumber(rawBody?.salaryMin),
    salaryMax: cleanNullableNumber(rawBody?.salaryMax),
  });

  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json(
      {
        error: "Please check the job details.",
        fields: parsed.success
          ? { id: ["Job id is required."] }
          : z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (
    payload.salaryMin !== null &&
    payload.salaryMax !== null &&
    payload.salaryMin > payload.salaryMax
  ) {
    return NextResponse.json(
      { error: "Minimum salary cannot be greater than maximum salary." },
      { status: 400 },
    );
  }

  const skills = splitCommaList(payload.skills);
  const responsibilities = payload.description
    .split(/\n+/)
    .map((item) => item.trim().replace(/^[-*•]\s*/, ""))
    .filter((item) => item.length > 12)
    .slice(0, 8);
  const { supabase, user } = auth;
  const { data: existingJob, error: existingJobError } = await supabase
    .from("jobs")
    .select("id, status, boost_id")
    .eq("id", payload.id)
    .eq("recruiter_id", user.id)
    .maybeSingle();

  if (existingJobError) {
    logServerError("employer_job_entitlement_lookup_failed", existingJobError);
    return safeServerError("Could not update the job.");
  }
  if (!existingJob) {
    return NextResponse.json({ error: "Job was not found." }, { status: 404 });
  }

  try {
    const entitlements = await loadEmployerEntitlements(supabase);
    if (
      payload.status === "published" &&
      existingJob.status !== "published" &&
      entitlements.activeJobs >= entitlements.activeJobLimit
    ) {
      return entitlementDenied("Your active job limit has been reached.");
    }
    if (
      payload.boostId !== "none" &&
      existingJob.boost_id !== payload.boostId &&
      entitlements.boostCredits < 1
    ) {
      return entitlementDenied(
        "A boost credit is required for this placement.",
      );
    }
  } catch (error) {
    logServerError("employer_job_entitlement_load_failed", error);
    return safeServerError("Could not update the job.");
  }
  const { data: job, error } = await supabase
    .from("jobs")
    .update({
      company_name: payload.companyName,
      title: payload.title,
      description: payload.description,
      location: payload.location,
      street_address: payload.streetAddress || null,
      employment_type: payload.employmentType,
      work_mode: getWorkMode(payload.remote),
      applicant_distance_miles: payload.distance,
      include_relocation: payload.includeRelocation,
      salary_min: payload.salaryMin,
      salary_max: payload.salaryMax,
      salary_currency: payload.salaryCurrency,
      salary_frequency: payload.payFrequency,
      skills,
      responsibilities,
      benefits: payload.benefits.includes("None") ? [] : payload.benefits,
      boost_id: payload.boostId,
      notification_email: payload.notificationEmail || null,
      screening_questions: payload.screeningQuestions,
      status: payload.status,
      expires_at: payload.status === "published" ? defaultExpiryDate(30) : null,
      category: skills[0] ?? null,
    })
    .eq("id", payload.id)
    .eq("recruiter_id", user.id)
    .select("id, slug, status, title, company_name, created_at")
    .single();

  if (error) {
    if (error.code === "P0001") {
      return entitlementDenied("Your job or boost entitlement is unavailable.");
    }
    logServerError("employer_job_update_failed", error);
    return safeServerError("Could not update the job.");
  }

  return NextResponse.json({ job });
}
