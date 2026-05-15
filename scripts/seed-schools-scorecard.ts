import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

type ScorecardSchool = {
  id: number | string;
  "school.name"?: string;
  "school.city"?: string;
  "school.state"?: string;
  "school.zip"?: string;
  "school.school_url"?: string;
  "latest.student.size"?: number | null;
};

type SchoolInsert = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  school_url: string | null;
  student_size: number | null;
  popularity_rank: number;
  source: string;
  updated_at: string;
};

const SCORECARD_API_URL =
  "https://api.data.gov/ed/collegescorecard/v1/schools.json";

const PER_PAGE = 100;
const BATCH_SIZE = 500;

const POPULAR_SCHOOL_RANKS: Record<string, number> = {
  "Harvard University": 1,
  "Stanford University": 2,
  "Massachusetts Institute of Technology": 3,
  "University of California-Berkeley": 4,
  "University of California-Los Angeles": 5,
  "University of Southern California": 6,
  "University of Michigan-Ann Arbor": 7,
  "New York University": 8,
  "Columbia University in the City of New York": 9,
  "University of Washington-Seattle Campus": 10,
  "The University of Texas at Austin": 11,
  "Arizona State University Campus Immersion": 12,
  "California State University-Northridge": 13,
  "California State University-Los Angeles": 14,
  "California State University-Fullerton": 15,
  "California State University-Long Beach": 16,
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeUrl(value: unknown) {
  const url = normalizeText(value);

  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}

function getPopularityRank(name: string, studentSize: number | null) {
  const explicitRank = POPULAR_SCHOOL_RANKS[name];

  if (explicitRank) return explicitRank;

  if (!studentSize) return 100000;

  return Math.max(100, 100000 - studentSize);
}

function toSchoolInsert(row: ScorecardSchool): SchoolInsert | null {
  const name = normalizeText(row["school.name"]);

  if (!name) return null;

  const studentSize =
    typeof row["latest.student.size"] === "number"
      ? row["latest.student.size"]
      : null;

  return {
    id: String(row.id),
    name,
    city: normalizeText(row["school.city"]),
    state: normalizeText(row["school.state"]),
    zip_code: normalizeText(row["school.zip"]),
    school_url: normalizeUrl(row["school.school_url"]),
    student_size: studentSize,
    popularity_rank: getPopularityRank(name, studentSize),
    source: "college_scorecard",
    updated_at: new Date().toISOString(),
  };
}

async function fetchPage(apiKey: string, page: number) {
  const params = new URLSearchParams({
    api_key: apiKey,
    page: String(page),
    per_page: String(PER_PAGE),
    fields: [
      "id",
      "school.name",
      "school.city",
      "school.state",
      "school.zip",
      "school.school_url",
      "latest.student.size",
    ].join(","),
  });

  const response = await fetch(`${SCORECARD_API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `College Scorecard request failed. Page ${page}. Status ${response.status}`,
    );
  }

  return (await response.json()) as {
    metadata?: {
      page?: number;
      total?: number;
      per_page?: number;
    };
    results?: ScorecardSchool[];
  };
}

async function main() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const scorecardApiKey = getRequiredEnv("COLLEGE_SCORECARD_API_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  let page = 0;
  let total = 0;
  let imported = 0;

  while (true) {
    const payload = await fetchPage(scorecardApiKey, page);
    const rows = (payload.results ?? [])
      .map(toSchoolInsert)
      .filter((school): school is SchoolInsert => Boolean(school));

    if (page === 0) {
      total = payload.metadata?.total ?? 0;
      console.log(`College Scorecard total: ${total.toLocaleString()}`);
    }

    if (rows.length === 0) break;

    for (let index = 0; index < rows.length; index += BATCH_SIZE) {
      const batch = rows.slice(index, index + BATCH_SIZE);

      const { error } = await supabase.from("schools").upsert(batch, {
        onConflict: "id",
      });

      if (error) {
        throw new Error(
          `Failed to upsert schools at page ${page}: ${error.message}`,
        );
      }

      imported += batch.length;
    }

    console.log(`Imported ${imported.toLocaleString()} schools...`);

    const perPage = payload.metadata?.per_page ?? PER_PAGE;

    if (imported >= total || rows.length < perPage) break;

    page += 1;
  }

  console.log(`Done. Imported ${imported.toLocaleString()} schools.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
