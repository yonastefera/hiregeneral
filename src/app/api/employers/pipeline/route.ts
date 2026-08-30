import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_PIPELINE_STAGES,
  pipelineConfigurationSchema,
} from "@/lib/applications/pipeline";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  boundedJsonBody,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { employerPipelineRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireEmployerUser();
  if (!auth.user)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.supabase
    .from("employer_pipeline_stages")
    .select("id, name, position, application_status")
    .eq("recruiter_id", auth.user.id)
    .order("position");

  if (error) return safeServerError("Could not load the candidate pipeline.");

  const stages = data?.length
    ? data.map((stage) => ({
        id: stage.id,
        name: stage.name,
        position: stage.position,
        applicationStatus: stage.application_status,
      }))
    : DEFAULT_PIPELINE_STAGES;
  return NextResponse.json({ stages });
}

export async function PUT(request: NextRequest) {
  const auth = await requireEmployerUser();
  if (!auth.user)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const limit = await employerPipelineRateLimit.limit(auth.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many pipeline updates." },
      { status: 429 },
    );
  }

  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = pipelineConfigurationSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter 2–12 uniquely named stages in order." },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await auth.supabase.rpc(
      "employer_replace_pipeline_stages",
      {
        p_stages: parsed.data.stages,
      },
    );
    if (error) throw error;
    return NextResponse.json({
      stages: data.map(
        (stage: {
          id: string;
          name: string;
          position: number;
          application_status: string;
        }) => ({
          id: stage.id,
          name: stage.name,
          position: stage.position,
          applicationStatus: stage.application_status,
        }),
      ),
    });
  } catch (error) {
    logServerError("employer_pipeline_update_failed", error);
    return safeServerError("Could not update the candidate pipeline.");
  }
}
