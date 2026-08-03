import { NextResponse } from "next/server";
import { z } from "zod";

import {
  enforceRateLimit,
  logServerError,
  requestIp,
  safeServerError,
} from "@/lib/http/api-security";
import { reverseGeocodeRateLimit } from "@/lib/rate-limit";

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResult = {
  address_components: GoogleAddressComponent[];
  formatted_address: string;
  place_id: string;
  types: string[];
};

type GoogleReverseGeocodeResponse = {
  results?: GoogleGeocodeResult[];
  status: string;
  error_message?: string;
};

const coordinatesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

function getComponent(
  components: GoogleAddressComponent[],
  type: string,
  name: "long_name" | "short_name" = "long_name",
) {
  return components.find((component) => component.types.includes(type))?.[name];
}

function pickCity(components: GoogleAddressComponent[]) {
  return (
    getComponent(components, "locality") ??
    getComponent(components, "postal_town") ??
    getComponent(components, "sublocality") ??
    getComponent(components, "administrative_area_level_3") ??
    getComponent(components, "administrative_area_level_2")
  );
}

function pickLocationFromGoogleResult(result: GoogleGeocodeResult) {
  const city = pickCity(result.address_components);
  const state = getComponent(
    result.address_components,
    "administrative_area_level_1",
    "short_name",
  );
  const zip_code =
    getComponent(result.address_components, "postal_code", "short_name") ??
    null;

  if (!city || !state) {
    return null;
  }

  return {
    city,
    state,
    zip_code,
    label: `${city}, ${state}`,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = coordinatesSchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Missing or invalid lat/lng.",
      },
      {
        status: 400,
      },
    );
  }
  const { lat, lng } = parsed.data;

  const limited = await enforceRateLimit({
    limiter: reverseGeocodeRateLimit,
    key: requestIp(request),
    context: "reverse_geocode",
  });
  if (limited) return limited;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    logServerError("reverse_geocode_not_configured", {
      code: "CONFIGURATION_MISSING",
    });
    return safeServerError("Reverse geocoding is unavailable.");
  }

  const googleUrl = new URL(
    "https://maps.googleapis.com/maps/api/geocode/json",
  );

  googleUrl.searchParams.set("latlng", `${lat},${lng}`);
  googleUrl.searchParams.set("key", apiKey);
  googleUrl.searchParams.set("result_type", "locality|postal_code");
  googleUrl.searchParams.set("language", "en");

  let response: Response;
  try {
    response = await fetch(googleUrl.toString(), {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    logServerError("reverse_geocode_provider_failed", error);
    return NextResponse.json(
      { error: "Reverse geocoding is temporarily unavailable." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Reverse geocoding request failed.",
      },
      {
        status: 502,
      },
    );
  }

  const body = (await response.json()) as GoogleReverseGeocodeResponse;

  if (body.status !== "OK") {
    logServerError("reverse_geocode_provider_rejected", { code: body.status });
    return NextResponse.json(
      { error: "Reverse geocoding is temporarily unavailable." },
      {
        status: 502,
      },
    );
  }

  const location =
    body.results
      ?.map(pickLocationFromGoogleResult)
      .find((candidate) => candidate !== null) ?? null;

  if (!location) {
    return NextResponse.json(
      {
        error: "Could not resolve city and state from those coordinates.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(
    { location },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
