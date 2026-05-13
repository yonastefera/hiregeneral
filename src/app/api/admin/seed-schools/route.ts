import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CollegeScorecardSchool = {
  id: number;
  "school.name": string;
  "school.city": string | null;
  "school.state": string | null;
};

type CollegeScorecardResponse = {
  results?: CollegeScorecardSchool[];
};

const COLLEGE_SCORECARD_BASE_URL =
  "https://api.data.gov/ed/collegescorecard/v1/schools";

const PAGE_SIZE = 100;
const MAX_PAGES_PER_RUN = 20;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function normalizeSchoolName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SEED_SECRET;
  const providedSecret = request.headers.get("x-admin-seed-secret");

  if (!adminSecret || providedSecret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let apiKey: string;

  try {
    apiKey = getRequiredEnv("COLLEGE_SCORECARD_API_KEY");
  } catch {
    return NextResponse.json(
      { error: "Missing COLLEGE_SCORECARD_API_KEY." },
      { status: 500 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);

  const startPageParam = searchParams.get("page");
  const startPage = startPageParam ? Number(startPageParam) : 0;

  if (!Number.isInteger(startPage) || startPage < 0) {
    return NextResponse.json(
      { error: "Invalid page. Page must be a non-negative integer." },
      { status: 400 },
    );
  }

  let totalUpserted = 0;
  let lastPage = startPage;

  for (let page = startPage; page < startPage + MAX_PAGES_PER_RUN; page += 1) {
    const url = new URL(COLLEGE_SCORECARD_BASE_URL);

    url.searchParams.set("per_page", String(PAGE_SIZE));
    url.searchParams.set("page", String(page));
    url.searchParams.set(
      "fields",
      ["id", "school.name", "school.city", "school.state"].join(","),
    );

    const response = await fetch(url, {
      headers: {
        "X-Api-Key": apiKey,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "College Scorecard request failed.",
          status: response.status,
          page,
          totalUpserted,
        },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as CollegeScorecardResponse;

    const rows = (payload.results ?? [])
      .filter((school) => school.id && school["school.name"])
      .map((school) => ({
        id: String(school.id),
        name: normalizeSchoolName(school["school.name"]),
        city: school["school.city"],
        state: school["school.state"],
        source: "college_scorecard",
      }));

    if (rows.length === 0) {
      return NextResponse.json({
        done: true,
        lastPage: page,
        nextPage: null,
        totalUpserted,
      });
    }

    const { error } = await supabase.from("schools").upsert(rows, {
      onConflict: "id",
    });

    if (error) {
      return NextResponse.json(
        {
          error: "Could not upsert schools.",
          details: error.message,
          page,
          totalUpserted,
        },
        { status: 500 },
      );
    }

    totalUpserted += rows.length;
    lastPage = page;
  }

  return NextResponse.json({
    done: false,
    lastPage,
    nextPage: lastPage + 1,
    totalUpserted,
  });
}
