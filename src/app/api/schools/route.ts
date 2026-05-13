import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type SchoolRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  popularity_rank: number;
};

type SchoolSuggestion = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  label: string;
};

function normalizeQuery(value: string | null) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function escapeIlike(value: string) {
  return value.replace(/[%_]/g, "\\$&");
}

function toSuggestion(school: SchoolRow): SchoolSuggestion {
  return {
    id: school.id,
    name: school.name,
    city: school.city,
    state: school.state,
    label:
      school.city && school.state
        ? `${school.name} — ${school.city}, ${school.state}`
        : school.name,
  };
}

function rankSchool(name: string, query: string) {
  const normalizedName = name.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (normalizedName === normalizedQuery) return 0;
  if (normalizedName.startsWith(normalizedQuery)) return 1;

  const words = normalizedName.split(/\s+/);

  if (words.some((word) => word.startsWith(normalizedQuery))) return 2;
  if (normalizedName.includes(normalizedQuery)) return 3;

  return 4;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeQuery(searchParams.get("query"));

  if (query.length < 1) {
    return NextResponse.json({ schools: [] });
  }

  const supabase = await createClient();
  const safeQuery = escapeIlike(query);

  const { data, error } = await supabase
    .from("schools")
    .select("id,name,city,state,popularity_rank")
    .ilike("name", `%${safeQuery}%`)
    .order("popularity_rank", { ascending: true })
    .order("name", { ascending: true })
    .limit(80);

  if (error) {
    return NextResponse.json(
      { error: "Could not fetch school suggestions." },
      { status: 500 },
    );
  }

  const schools = ((data ?? []) as SchoolRow[])
    .sort((first, second) => {
      const firstTextRank = rankSchool(first.name, query);
      const secondTextRank = rankSchool(second.name, query);

      if (firstTextRank !== secondTextRank) {
        return firstTextRank - secondTextRank;
      }

      if (first.popularity_rank !== second.popularity_rank) {
        return first.popularity_rank - second.popularity_rank;
      }

      return first.name.localeCompare(second.name);
    })
    .slice(0, 8)
    .map(toSuggestion);

  return NextResponse.json({ schools });
}
