import { NextRequest, NextResponse } from "next/server";

import { getEmployerCandidates } from "@/employer/dashboard/candidates/employer-candidates-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const data = await getEmployerCandidates({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    jobId: searchParams.get("jobId"),
    query: searchParams.get("query"),
  });

  return NextResponse.json(data);
}
