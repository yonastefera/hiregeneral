import { NextResponse } from "next/server";

import { getHiringCompaniesThisWeek } from "@/employer/landing/hiring-this-week";
import { logServerError, safeServerError } from "@/lib/http/api-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await getHiringCompaniesThisWeek();

    return NextResponse.json({ companies });
  } catch (error) {
    logServerError("hiring_companies_load_failed", error);
    return safeServerError("Could not load hiring companies.");
  }
}
