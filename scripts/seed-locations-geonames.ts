import dotenv from "dotenv";
import AdmZip from "adm-zip";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

type GeoNamesPostalCodeRow = {
  countryCode: string;
  postalCode: string;
  placeName: string;
  adminName1: string;
  adminCode1: string;
  adminName2: string;
  adminCode2: string;
  adminName3: string;
  adminCode3: string;
  latitude: string;
  longitude: string;
  accuracy: string;
};

type LocationInsert = {
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  popularity_rank: number;
  source: string;
};

const GEONAMES_US_ZIP_URL = "https://download.geonames.org/export/zip/US.zip";
const BATCH_SIZE = 1000;

const POPULAR_CITY_RANKS: Record<string, number> = {
  "New York|NY": 1,
  "Los Angeles|CA": 2,
  "Chicago|IL": 3,
  "Houston|TX": 4,
  "Phoenix|AZ": 5,
  "Philadelphia|PA": 6,
  "San Antonio|TX": 7,
  "San Diego|CA": 8,
  "Dallas|TX": 9,
  "San Jose|CA": 10,
  "Austin|TX": 11,
  "Jacksonville|FL": 12,
  "Fort Worth|TX": 13,
  "Columbus|OH": 14,
  "Charlotte|NC": 15,
  "San Francisco|CA": 16,
  "Indianapolis|IN": 17,
  "Seattle|WA": 18,
  "Denver|CO": 19,
  "Washington|DC": 20,
  "Boston|MA": 21,
  "Atlanta|GA": 22,
  "Miami|FL": 23,
  "Las Vegas|NV": 24,
  "Nashville|TN": 25,
  "Portland|OR": 26,
  "Detroit|MI": 27,
  "Baltimore|MD": 28,
  "Raleigh|NC": 29,
  "Orlando|FL": 30,
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeText(value: string | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function toNumberOrNull(value: string) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function parseGeoNamesLine(line: string): GeoNamesPostalCodeRow | null {
  const columns = line.split("\t");

  if (columns.length < 12) return null;

  return {
    countryCode: columns[0] ?? "",
    postalCode: columns[1] ?? "",
    placeName: columns[2] ?? "",
    adminName1: columns[3] ?? "",
    adminCode1: columns[4] ?? "",
    adminName2: columns[5] ?? "",
    adminCode2: columns[6] ?? "",
    adminName3: columns[7] ?? "",
    adminCode3: columns[8] ?? "",
    latitude: columns[9] ?? "",
    longitude: columns[10] ?? "",
    accuracy: columns[11] ?? "",
  };
}

function toLocationInsert(row: GeoNamesPostalCodeRow): LocationInsert | null {
  const city = normalizeText(row.placeName);
  const state = normalizeText(row.adminCode1);
  const zipCode = normalizeText(row.postalCode);

  if (!city || !state || !zipCode) return null;

  const popularityKey = `${city}|${state}`;

  return {
    city,
    state,
    zip_code: zipCode,
    country: "USA",
    latitude: toNumberOrNull(row.latitude),
    longitude: toNumberOrNull(row.longitude),
    popularity_rank: POPULAR_CITY_RANKS[popularityKey] ?? 100,
    source: "geonames",
  };
}

function dedupeLocations(rows: LocationInsert[]) {
  const seen = new Set<string>();
  const deduped: LocationInsert[] = [];

  for (const row of rows) {
    const key = [
      row.country.toLowerCase(),
      row.zip_code.toLowerCase(),
      row.city.toLowerCase(),
      row.state.toLowerCase(),
    ].join("|");

    if (seen.has(key)) continue;

    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

async function downloadGeoNamesZip() {
  const response = await fetch(GEONAMES_US_ZIP_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to download GeoNames US.zip. Status: ${response.status}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

async function main() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log("Downloading GeoNames US postal-code dataset...");

  const zipBuffer = await downloadGeoNamesZip();
  const zip = new AdmZip(zipBuffer);
  const entry = zip.getEntry("US.txt");

  if (!entry) {
    throw new Error("Could not find US.txt inside GeoNames US.zip.");
  }

  const text = entry.getData().toString("utf8");

  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseGeoNamesLine)
    .filter((row): row is GeoNamesPostalCodeRow => Boolean(row))
    .map(toLocationInsert)
    .filter((row): row is LocationInsert => Boolean(row));

  const dedupedRows = dedupeLocations(rows);

  console.log(`Parsed ${rows.length.toLocaleString()} rows.`);
  console.log(`Deduped to ${dedupedRows.length.toLocaleString()} rows.`);

  let imported = 0;

  for (let index = 0; index < dedupedRows.length; index += BATCH_SIZE) {
    const batch = dedupedRows.slice(index, index + BATCH_SIZE);

    const { error } = await supabase.from("locations").upsert(batch, {
      onConflict: "country,zip_code,city,state",
    });

    if (error) {
      throw new Error(
        `Failed to upsert locations at batch starting ${index}: ${error.message}`,
      );
    }

    imported += batch.length;

    console.log(
      `Imported ${imported.toLocaleString()} / ${dedupedRows.length.toLocaleString()} locations...`,
    );
  }

  const { count, error: countError } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.warn("Imported successfully, but count check failed:", countError);
  } else {
    console.log(
      `Done. public.locations now has ${count?.toLocaleString()} rows.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
