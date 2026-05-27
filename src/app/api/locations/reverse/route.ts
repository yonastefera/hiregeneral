import { NextResponse } from "next/server";

type MapboxFeature = {
  properties?: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
    context?: {
      place?: {
        name?: string;
      };
      locality?: {
        name?: string;
      };
      region?: {
        name?: string;
        region_code?: string;
      };
      postcode?: {
        name?: string;
      };
    };
  };
};

type MapboxReverseResponse = {
  features?: MapboxFeature[];
};

function normalizeRegionCode(value: string | undefined) {
  if (!value) return null;

  /*
    Mapbox often returns US state codes as "US-NY".
    Your app's SelectedLocation shape expects just "NY".
  */
  const parts = value.split("-");
  return parts[parts.length - 1] || value;
}

function pickLocationFromMapboxFeature(feature: MapboxFeature) {
  const context = feature.properties?.context;

  const city =
    context?.place?.name ??
    context?.locality?.name ??
    feature.properties?.name ??
    null;

  const state =
    normalizeRegionCode(context?.region?.region_code) ??
    context?.region?.name ??
    null;

  const zip_code = context?.postcode?.name ?? null;

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

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      {
        error: "Missing or invalid lat/lng.",
      },
      {
        status: 400,
      },
    );
  }

  const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      {
        error: "Missing MAPBOX_ACCESS_TOKEN.",
      },
      {
        status: 500,
      },
    );
  }

  const mapboxUrl = new URL("https://api.mapbox.com/search/geocode/v6/reverse");

  mapboxUrl.searchParams.set("latitude", String(lat));
  mapboxUrl.searchParams.set("longitude", String(lng));
  mapboxUrl.searchParams.set("access_token", accessToken);
  mapboxUrl.searchParams.set("limit", "1");
  mapboxUrl.searchParams.set("language", "en");

  const response = await fetch(mapboxUrl.toString(), {
    next: {
      revalidate: 60 * 60 * 24,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Reverse geocoding failed.",
      },
      {
        status: 502,
      },
    );
  }

  const body = (await response.json()) as MapboxReverseResponse;
  const feature = body.features?.[0];

  if (!feature) {
    return NextResponse.json(
      {
        error: "No location found for those coordinates.",
      },
      {
        status: 404,
      },
    );
  }

  const location = pickLocationFromMapboxFeature(feature);

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

  return NextResponse.json({
    location,
  });
}
