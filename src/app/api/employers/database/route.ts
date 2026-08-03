import { NextRequest, NextResponse } from "next/server";

import { getEmployerResumeDatabaseData } from "@/employer/dashboard/database/employer-resume-database-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  entitlementDenied,
  loadEmployerEntitlements,
} from "@/lib/billing/entitlements";
import { logServerError, safeServerError } from "@/lib/http/api-security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const entitlements = await loadEmployerEntitlements(auth.supabase);
    if (!entitlements.candidateDatabase) {
      return entitlementDenied(
        "An active Growth or Pro plan is required for the resume database.",
      );
    }
  } catch (error) {
    logServerError("employer_database_entitlement_failed", error);
    return safeServerError("Could not load the resume database.");
  }

  const { searchParams } = new URL(request.url);
  const data = await getEmployerResumeDatabaseData({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    jobId: searchParams.get("jobId"),
    query: searchParams.get("query"),
    resumeOnly: searchParams.get("resumeOnly") !== "false",
  });

  return NextResponse.json(data);
}
