import { NextResponse } from "next/server";

import { loadHomeInsights } from "@/home/home-insights";

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
    console.error("[api/home/salary-insights]", error);

    return NextResponse.json({
      salaryBands: [],
      marketCategories: [],
    });
  }
}
