import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { locationSearchRateLimit, redis } from "@/lib/rate-limit";
import {
  enforceRateLimit,
  logServerError,
  requestIp,
  safeServerError,
} from "@/lib/http/api-security";

type LocationRow = {
  id: number | string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  popularity_rank: number | null;
};

type LocationSuggestion = {
  id: string;
  label: string;
  city: string;
  state: string;
  zip_code: string | null;
  country: string;
};

type LocationSearchPayload = {
  locations: LocationSuggestion[];
};

const LOCATION_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const LOCATION_CACHE_VERSION = process.env.LOCATION_CACHE_VERSION ?? "6";
const querySchema = z.string().trim().max(120);

function normalizeQuery(value: string | null) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function cleanText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function getLocationCacheKey(query: string) {
  return `locations:${LOCATION_CACHE_VERSION}:${query.toLowerCase()}`;
}

function toSuggestion(location: LocationRow): LocationSuggestion | null {
  const city = cleanText(location.city);
  const state = cleanText(location.state);
  const zipCode = cleanText(location.zip_code);
  const country = cleanText(location.country) || "USA";

  if (!city || !state) {
    return null;
  }

  const id = String(location.id || `${city}-${state}-${zipCode || country}`);

  return {
    id,
    label: `${city}, ${state}`,
    city,
    state,
    zip_code: zipCode || null,
    country,
  };
}

function dedupeLocations(locations: LocationSuggestion[]) {
  const seen = new Set<string>();

  return locations.filter((location) => {
    const key = [
      location.city.toLowerCase(),
      location.state.toLowerCase(),
    ].join(":");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function jsonResponse(payload: LocationSearchPayload, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
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
    return jsonResponse({ locations: [] });
  }

  const cacheKey = getLocationCacheKey(query);

  /**
   * Read Redis before rate limiting.
   * Cached public autocomplete responses should return fast without spending
   * an additional rate-limit operation.
   */
  try {
    const cached = await redis.get<LocationSearchPayload>(cacheKey);

    if (cached) {
      return jsonResponse(cached);
    }
  } catch (error) {
    logServerError("location_cache_read_failed", error);
  }

  const limited = await enforceRateLimit({
    limiter: locationSearchRateLimit,
    key: requestIp(request),
    context: "location_search",
    message: "Too many location searches. Please try again shortly.",
  });
  if (limited) return limited;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_locations", {
    search_query: query,
  });

  if (error) {
    logServerError("location_search_query_failed", error);
    return safeServerError("Could not fetch location suggestions.");
  }

  const locations = dedupeLocations(
    ((data ?? []) as LocationRow[])
      .map(toSuggestion)
      .filter((location): location is LocationSuggestion => Boolean(location)),
  );

  const payload: LocationSearchPayload = {
    locations,
  };

  try {
    await redis.set(cacheKey, payload, {
      ex: LOCATION_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    logServerError("location_cache_write_failed", error);
  }

  return jsonResponse(payload);
}
