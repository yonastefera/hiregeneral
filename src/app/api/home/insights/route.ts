import { NextResponse } from "next/server";

import { loadHomeInsights } from "@/home/home-insights";
import { logServerError } from "@/lib/http/api-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const insights = await loadHomeInsights();

    return NextResponse.json(insights, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    logServerError("home_insights_load_failed", error);

    return NextResponse.json({
      salaryBands: [],
      marketCategories: [],
    });
  }
}
