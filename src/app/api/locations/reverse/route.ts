import { NextResponse } from "next/server";

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

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Missing GOOGLE_MAPS_API_KEY.",
      },
      {
        status: 500,
      },
    );
  }

  const googleUrl = new URL(
    "https://maps.googleapis.com/maps/api/geocode/json",
  );

  googleUrl.searchParams.set("latlng", `${lat},${lng}`);
  googleUrl.searchParams.set("key", apiKey);
  googleUrl.searchParams.set("result_type", "locality|postal_code");
  googleUrl.searchParams.set("language", "en");

  const response = await fetch(googleUrl.toString(), {
    next: {
      revalidate: 60 * 60 * 24,
    },
  });

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
    return NextResponse.json(
      {
        error:
          body.error_message ??
          `Google reverse geocoding failed with status: ${body.status}`,
      },
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

  return NextResponse.json({
    location,
  });
}
