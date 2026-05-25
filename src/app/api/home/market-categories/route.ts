import { NextResponse } from "next/server";

import { loadHomeInsights } from "@/home/home-insights";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET() {
  try {
    const { marketCategories } = await loadHomeInsights();

    return NextResponse.json({
      marketCategories,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load market categories.",
      },
      { status: 500 },
    );
  }
}
