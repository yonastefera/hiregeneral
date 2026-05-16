import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { locationSearchRateLimit, redis } from "@/lib/rate-limit";

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

function normalizeQuery(value: string | null) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function cleanText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return realIp || "unknown";
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
  const query = normalizeQuery(searchParams.get("query"));

  if (query.length < 2) {
    return jsonResponse({ locations: [] });
  }

  /*
   * Bump this whenever location label formatting changes.
   * Old malformed Redis entries may otherwise keep showing.
   */
  const LOCATION_CACHE_VERSION = process.env.LOCATION_CACHE_VERSION ?? "6";

  const cacheKey = `locations:${LOCATION_CACHE_VERSION}:${query.toLowerCase()}`;

  try {
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await locationSearchRateLimit.limit(identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many location searches. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(
                1,
                Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
              ),
            ),
          },
        },
      );
    }
  } catch (error) {
    console.error(
      "[locations] Rate limit failed. Continuing without it.",
      error,
    );
  }

  try {
    const cached = await redis.get<LocationSearchPayload>(cacheKey);

    if (cached) {
      return jsonResponse(cached);
    }
  } catch (error) {
    console.error("[locations] Redis cache read failed. Continuing.", error);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("search_locations", {
    search_query: query,
  });

  if (error) {
    console.error("[locations] Supabase RPC failed:", {
      query,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    return NextResponse.json(
      {
        error: "Could not fetch location suggestions.",
        details: error.message,
      },
      { status: 500 },
    );
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
    console.error("[locations] Redis cache write failed. Continuing.", error);
  }

  return jsonResponse(payload);
}
