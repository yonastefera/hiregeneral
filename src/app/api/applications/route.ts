import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendApplicationConfirmationEmail } from "@/lib/email/send";
import {
  applicationSubmissionSchema,
  getOwnedResumeFileName,
  isJobAcceptingApplications,
} from "@/lib/applications/submission";
import {
  boundedJsonBody,
  JSON_BODY_LIMITS,
  logServerError,
} from "@/lib/http/api-security";
import { applicationSubmissionRateLimit } from "@/lib/rate-limit";
import { startOperation, withRequestId } from "@/lib/logging/observability";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const INTERNAL_ERROR = "Could not process your application. Please try again.";

function retryAfterSeconds(reset: number) {
  return String(Math.max(1, Math.ceil((reset - Date.now()) / 1_000)));
}

export async function POST(req: NextRequest) {
  const operation = startOperation(req, {
    route: "/api/applications",
    operation: "submit_application",
  });
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    operation.failure("authentication", authError);
    return withRequestId(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      operation.context.requestId,
    );
  }
  operation.context.userId = user.id;

  try {
    const rateLimit = await applicationSubmissionRateLimit.limit(user.id);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many application attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": retryAfterSeconds(rateLimit.reset) },
        },
      );
    }
  } catch (error) {
    logServerError("application_rate_limit_unavailable", error);
  }

  const body = await boundedJsonBody(req, JSON_BODY_LIMITS.medium);
  if (!body.ok) return body.response;
  const parsed = applicationSubmissionSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check your application details.",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const submission = parsed.data;
  const resumeFileName = getOwnedResumeFileName(submission.resume_url, user.id);

  if (!resumeFileName) {
    return NextResponse.json(
      { error: "Select a resume uploaded to your account." },
      { status: 400 },
    );
  }

  const { data: resumeFiles, error: resumeError } = await supabase.storage
    .from("resumes")
    .list(user.id, { limit: 10, search: resumeFileName });

  if (resumeError) {
    operation.failure("database", resumeError, {
      stage: "resume_verification",
    });
    logServerError("application_resume_verification_failed", resumeError);
    return NextResponse.json({ error: INTERNAL_ERROR }, { status: 500 });
  }

  if (!resumeFiles?.some((file) => file.name === resumeFileName)) {
    return NextResponse.json(
      { error: "The selected resume could not be found. Upload it again." },
      { status: 400 },
    );
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, title, company_name, status, expires_at")
    .eq("id", submission.job_id)
    .maybeSingle();

  if (jobError) {
    operation.failure("database", jobError, { stage: "job_verification" });
    logServerError("application_job_verification_failed", jobError);
    return NextResponse.json({ error: INTERNAL_ERROR }, { status: 500 });
  }

  if (!job || !isJobAcceptingApplications(job)) {
    return NextResponse.json(
      { error: "This job is no longer accepting applications." },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      job_id: submission.job_id,
      resume_url: submission.resume_url,
      cover_note: submission.cover_note,
      applicant_full_name: submission.applicant_full_name,
      applicant_email: submission.applicant_email,
      applicant_phone: submission.applicant_phone,
      applicant_location: submission.applicant_location,
      applicant_linkedin: submission.applicant_linkedin,
      applicant_portfolio: submission.applicant_portfolio,
      years_experience: submission.years_experience,
      work_authorization: submission.work_authorization,
      requires_sponsorship: submission.requires_sponsorship,
      status: "submitted",
    })
    .select("id, job_id, status, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Already applied to this job" },
        { status: 409 },
      );
    }

    logServerError("application_insert_failed", error);
    operation.failure("database", error, { stage: "application_insert" });

    return NextResponse.json({ error: INTERNAL_ERROR }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY) {
    void sendApplicationConfirmationEmail({
      to: submission.applicant_email,
      applicantName: submission.applicant_full_name,
      jobTitle: job.title,
      companyName: job.company_name,
    }).catch((emailError) => {
      logServerError("application_confirmation_email_failed", emailError);
    });
  }

  operation.success({ status: 201 });
  operation.metric("application_completed");
  return withRequestId(
    NextResponse.json({ id: data.id, status: data.status }, { status: 201 }),
    operation.context.requestId,
  );
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id, status, created_at, updated_at, resume_url, cover_note,
      application_status_events (
        id, status, stage_name, note, created_at
      ),
      jobs (
        id, title, company_name, company_logo_url,
        location, employment_type, work_mode, slug
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", {
      referencedTable: "application_status_events",
      ascending: true,
    })
    .order("created_at", { ascending: false });

  if (error) {
    logServerError("applications_load_failed", error);

    return NextResponse.json({ error: INTERNAL_ERROR }, { status: 500 });
  }

  return NextResponse.json({ data });
}
