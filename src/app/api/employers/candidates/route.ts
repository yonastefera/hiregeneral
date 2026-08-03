import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEmployerCandidates } from "@/employer/dashboard/candidates/employer-candidates-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import { logServerError, safeServerError } from "@/lib/http/api-security";

export const runtime = "nodejs";
const candidateQuerySchema = z.object({
  jobId: z.string().uuid().nullable(),
  query: z.string().trim().max(160).nullable(),
});

export async function GET(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const parsed = candidateQuerySchema.safeParse({
    jobId: searchParams.get("jobId"),
    query: searchParams.get("query"),
  });
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid candidate search parameters." },
      { status: 400 },
    );

  try {
    const data = await getEmployerCandidates({
      supabase: auth.supabase,
      recruiterId: auth.user.id,
      ...parsed.data,
    });
    return NextResponse.json(data);
  } catch (error) {
    logServerError("employer_candidates_load_failed", error);
    return safeServerError("Could not load candidates.");
  }
}
