import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEmployerInviteData } from "@/employer/dashboard/invite/employer-invite-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  entitlementDenied,
  loadEmployerEntitlements,
} from "@/lib/billing/entitlements";
import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { employerInviteRateLimit } from "@/lib/rate-limit";
import { enforceDuplicateCooldown } from "@/lib/security/abuse";

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

  try {
    const entitlements = await loadEmployerEntitlements(auth.supabase);
    if (!entitlements.candidateDatabase) {
      return entitlementDenied(
        "An active Growth or Pro plan is required for candidate invitations.",
      );
    }
  } catch (error) {
    logServerError("employer_invite_entitlement_load_failed", error);
    return safeServerError("Could not load candidate invitations.");
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

  const limited = await enforceRateLimit({
    limiter: employerInviteRateLimit,
    key: auth.user.id,
    context: "employer_invite_send",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = inviteSchema.safeParse(body.data);

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

  try {
    const entitlements = await loadEmployerEntitlements(supabase);
    if (!entitlements.candidateDatabase) {
      return entitlementDenied(
        "An active Growth or Pro plan is required for candidate invitations.",
      );
    }
    if (entitlements.invitationsUsed >= entitlements.invitationLimit) {
      return entitlementDenied(
        "Your monthly invitation limit has been reached.",
      );
    }
  } catch (error) {
    logServerError("employer_invite_entitlement_load_failed", error);
    return safeServerError("Could not send the invitation.");
  }

  const duplicate = await enforceDuplicateCooldown({
    scope: "employer_invite",
    actorKey: user.id,
    content: `${candidateId}\n${jobId}\n${message}`,
    ttlSeconds: 5 * 60,
  });
  if (duplicate) return duplicate;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("recruiter_id", user.id)
    .maybeSingle();

  if (jobError) {
    logServerError("employer_invite_job_lookup_failed", jobError);
    return safeServerError("Could not send the invitation.");
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
    logServerError("employer_invite_profile_lookup_failed", profileError);
    return safeServerError("Could not send the invitation.");
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
    if (inviteError.code === "P0001") {
      return entitlementDenied("Your invitation entitlement is unavailable.");
    }
    logServerError("employer_invite_save_failed", inviteError);
    return safeServerError("Could not send the invitation.");
  }

  return NextResponse.json({ invite }, { status: 201 });
}
