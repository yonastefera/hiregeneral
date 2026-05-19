import { NextResponse } from "next/server";

import { getHiringCompaniesThisWeek } from "@/employer/landing/hiring-this-week";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await getHiringCompaniesThisWeek();

    return NextResponse.json({ companies });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load hiring companies.",
      },
      { status: 500 },
    );
  }
}
