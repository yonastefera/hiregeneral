import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEmployerResumeDatabaseData } from "@/employer/dashboard/database/employer-resume-database-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  entitlementDenied,
  loadEmployerEntitlements,
} from "@/lib/billing/entitlements";
import { logServerError, safeServerError } from "@/lib/http/api-security";

export const runtime = "nodejs";
const databaseQuerySchema = z.object({
  jobId: z.string().uuid().nullable(),
  query: z.string().trim().max(160).nullable(),
  resumeOnly: z.boolean(),
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
        "An active Growth or Pro plan is required for the resume database.",
      );
    }
  } catch (error) {
    logServerError("employer_database_entitlement_failed", error);
    return safeServerError("Could not load the resume database.");
  }

  const { searchParams } = new URL(request.url);
  const parsed = databaseQuerySchema.safeParse({
    jobId: searchParams.get("jobId"),
    query: searchParams.get("query"),
    resumeOnly: searchParams.get("resumeOnly") !== "false",
  });
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid resume search parameters." },
      { status: 400 },
    );

  try {
    const data = await getEmployerResumeDatabaseData({
      supabase: auth.supabase,
      recruiterId: auth.user.id,
      ...parsed.data,
    });
    return NextResponse.json(data);
  } catch (error) {
    logServerError("employer_database_load_failed", error);
    return safeServerError("Could not load the resume database.");
  }
}
