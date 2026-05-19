import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEmployerInviteData } from "@/employer/dashboard/invite/employer-invite-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";

export const runtime = "nodejs";

const inviteSchema = z.object({
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
  message: z.string().trim().min(10).max(1_200),
});

export async function GET(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const data = await getEmployerInviteData({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    jobId: searchParams.get("jobId"),
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the invite details.",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const { candidateId, jobId, message } = parsed.data;
  const { supabase, user } = auth;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("recruiter_id", user.id)
    .maybeSingle();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json(
      { error: "You can only invite candidates to your own jobs." },
      { status: 404 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", candidateId)
    .eq("visibility", "public")
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Candidate profile is not available for invites." },
      { status: 404 },
    );
  }

  const { data: invite, error: inviteError } = await supabase
    .from("employer_candidate_invites")
    .upsert(
      {
        recruiter_id: user.id,
        candidate_id: candidateId,
        job_id: jobId,
        message,
        status: "sent",
      },
      { onConflict: "recruiter_id,candidate_id,job_id" },
    )
    .select("id, status, created_at")
    .single();

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ invite }, { status: 201 });
}
