import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getEmployerResumeDatabaseData } from "@/employer/dashboard/database/employer-resume-database-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import {
  entitlementDenied,
  loadEmployerEntitlements,
} from "@/lib/billing/entitlements";
import { logServerError, safeServerError } from "@/lib/http/api-security";
import { employerCandidateSearchRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
const databaseQuerySchema = z.object({
  jobId: z.string().uuid().nullable(),
  query: z.string().trim().max(160).nullable(),
  resumeOnly: z.boolean(),
  skills: z.array(z.string().trim().min(1).max(60)).max(10),
  location: z.string().trim().max(120).nullable(),
  experience: z.string().trim().max(80).nullable(),
  degree: z.string().trim().max(100).nullable(),
  industry: z.string().trim().max(100).nullable(),
  relocation: z.boolean(),
  sort: z.enum(["match", "recent"]),
});

export async function GET(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const limit = await employerCandidateSearchRateLimit.limit(auth.user.id);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many candidate searches. Please slow down." },
        { status: 429 },
      );
    }
  } catch (error) {
    logServerError("employer_candidate_search_rate_limit_unavailable", error);
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
    skills: searchParams.getAll("skill"),
    location: searchParams.get("location"),
    experience: searchParams.get("experience"),
    degree: searchParams.get("degree"),
    industry: searchParams.get("industry"),
    relocation: searchParams.get("relocation") === "true",
    sort: searchParams.get("sort") === "recent" ? "recent" : "match",
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
