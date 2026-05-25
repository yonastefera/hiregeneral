import { NextResponse } from "next/server";

import { loadHomeInsights } from "@/home/home-insights";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET() {
  try {
    const insights = await loadHomeInsights();

    return NextResponse.json(insights);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load homepage insights.",
      },
      { status: 500 },
    );
  }
}
