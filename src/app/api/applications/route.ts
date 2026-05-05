// src/app/api/applications/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const {
    job_id,
    resume_url,
    cover_note,
    applicant_full_name,
    applicant_email,
    applicant_phone,
    applicant_location,
    applicant_linkedin,
    applicant_portfolio,
    years_experience,
    work_authorization,
    requires_sponsorship,
  } = body;

  if (!job_id || !resume_url) {
    return NextResponse.json(
      { error: "job_id and resume_url are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      job_id,
      resume_url,
      cover_note: cover_note ?? null,
      applicant_full_name: applicant_full_name ?? null,
      applicant_email: applicant_email ?? null,
      applicant_phone: applicant_phone ?? null,
      applicant_location: applicant_location ?? null,
      applicant_linkedin: applicant_linkedin ?? null,
      applicant_portfolio: applicant_portfolio ?? null,
      years_experience: years_experience ?? null,
      work_authorization: work_authorization ?? null,
      requires_sponsorship: requires_sponsorship ?? "no",
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

    console.error("[POST /api/applications]", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("title, company_name")
    .eq("id", job_id)
    .single();

  if (process.env.RESEND_API_KEY && applicant_email && job) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.EMAIL_FROM ?? "HireGeneral <no-reply@hiregeneral.com>",
        to: applicant_email,
        subject: `Application received — ${job.title} at ${job.company_name}`,
        html: `
          <p>Hi ${applicant_full_name ?? "there"},</p>
          <p>We received your application for <strong>${job.title}</strong> at <strong>${job.company_name}</strong>.</p>
          <p>The hiring team will reach out if there's a fit.</p>
          <p>Good luck!<br/>The HireGeneral Team</p>
        `,
      }),
    }).catch((err) => console.error("[Resend]", err));
  }

  return NextResponse.json(
    { id: data.id, status: data.status },
    { status: 201 },
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
      id, status, created_at, resume_url, cover_note,
      jobs (
        id, title, company_name, company_logo_url,
        location, employment_type, work_mode, slug
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/applications]", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
