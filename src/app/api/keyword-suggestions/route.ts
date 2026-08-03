import { NextResponse } from "next/server";
import { z } from "zod";

import {
  enforceRateLimit,
  logServerError,
  requestIp,
  safeServerError,
} from "@/lib/http/api-security";
import { keywordSuggestionRateLimit, redis } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

type KeywordSuggestionRow = {
  id: string;
  term: string;
  category: string | null;
  popularity_rank: number;
};

type KeywordSuggestion = {
  id: string;
  term: string;
  label: string;
  category: string | null;
};

type KeywordSuggestionsPayload = {
  suggestions: KeywordSuggestion[];
};

const KEYWORD_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const KEYWORD_CACHE_VERSION = process.env.KEYWORD_CACHE_VERSION ?? "1";
const querySchema = z.string().trim().max(100);

function normalizeQuery(value: string | null) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function getKeywordCacheKey(query: string) {
  return `keyword-suggestions:${KEYWORD_CACHE_VERSION}:${query.toLowerCase()}`;
}

function toSuggestion(row: KeywordSuggestionRow): KeywordSuggestion {
  return {
    id: row.id,
    term: row.term,
    label: row.term,
    category: row.category,
  };
}

function jsonResponse(payload: KeywordSuggestionsPayload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(
    normalizeQuery(searchParams.get("query")),
  );
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid query." }, { status: 400 });
  const query = parsed.data;

  if (query.length < 2) {
    return jsonResponse({ suggestions: [] });
  }

  const limited = await enforceRateLimit({
    limiter: keywordSuggestionRateLimit,
    key: requestIp(request),
    context: "keyword_suggestions",
  });
  if (limited) return limited;

  const cacheKey = getKeywordCacheKey(query);

  try {
    const cached = await redis.get<KeywordSuggestionsPayload>(cacheKey);

    if (cached) {
      return jsonResponse(cached);
    }
  } catch (error) {
    logServerError("keyword_suggestions_cache_read_failed", error);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_keyword_suggestions", {
    search_query: query,
  });

  if (error) {
    logServerError("keyword_suggestions_query_failed", error);
    return safeServerError("Could not fetch keyword suggestions.");
  }

  const payload: KeywordSuggestionsPayload = {
    suggestions: ((data ?? []) as KeywordSuggestionRow[]).map(toSuggestion),
  };

  try {
    await redis.set(cacheKey, payload, {
      ex: KEYWORD_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    logServerError("keyword_suggestions_cache_write_failed", error);
  }

  return jsonResponse(payload);
}
