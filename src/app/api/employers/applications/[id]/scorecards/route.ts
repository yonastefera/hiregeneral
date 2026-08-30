import { NextRequest, NextResponse } from "next/server";

import { interviewScorecardSchema } from "@/lib/applications/scorecard";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  boundedJsonBody,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { employerScorecardRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

async function authorize(applicationId: string) {
  const auth = await requireEmployerUser();
  if (!auth.user) return { ...auth, allowed: false };
  const { data, error } = await auth.supabase.rpc(
    "can_access_employer_application",
    {
      p_application_id: applicationId,
      p_user_id: auth.user.id,
    },
  );
  return { ...auth, allowed: !error && data === true };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await authorize(id);
  if (!auth.user)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.allowed)
    return NextResponse.json(
      { error: "Application not found." },
      { status: 404 },
    );

  const { data, error } = await auth.supabase
    .from("interview_scorecards")
    .select(
      "id, reviewer_id, interview_round, recommendation, overall_rating, criteria, summary, submitted_at",
    )
    .eq("application_id", id)
    .order("submitted_at", { ascending: false });
  if (error) return safeServerError("Could not load interview scorecards.");

  const scorecards = data ?? [];
  const averageRating = scorecards.length
    ? scorecards.reduce((sum, item) => sum + item.overall_rating, 0) /
      scorecards.length
    : null;
  return NextResponse.json({
    scorecards,
    averageRating,
    currentUserId: auth.user.id,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await authorize(id);
  if (!auth.user)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!auth.allowed)
    return NextResponse.json(
      { error: "Application not found." },
      { status: 404 },
    );

  const limit = await employerScorecardRateLimit.limit(auth.user.id);
  if (!limit.success)
    return NextResponse.json(
      { error: "Too many scorecard updates." },
      { status: 429 },
    );
  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = interviewScorecardSchema.safeParse(body.data);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Complete every scorecard field." },
      { status: 400 },
    );

  try {
    const input = parsed.data;
    const { data, error } = await auth.supabase
      .from("interview_scorecards")
      .upsert(
        {
          application_id: id,
          reviewer_id: auth.user.id,
          interview_round: input.interviewRound,
          recommendation: input.recommendation,
          overall_rating: input.overallRating,
          criteria: input.criteria,
          summary: input.summary || null,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "application_id,reviewer_id,interview_round" },
      )
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    logServerError("interview_scorecard_save_failed", error);
    return safeServerError("Could not save the interview scorecard.");
  }
}
