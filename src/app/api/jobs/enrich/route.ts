import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export async function POST(request: NextRequest) {
  try {
    const ingestSecret = requireEnv("INGEST_SECRET");
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${ingestSecret}`) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "Job enrichment is disabled. HireGeneral now uses source-first rule-based job description rendering.",
      },
      { status: 410 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown enrichment error",
      },
      { status: 500 },
    );
  }
}
