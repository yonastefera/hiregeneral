import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createClient } from "@supabase/supabase-js";

const BLS_BASE_URL = "https://download.bls.gov/pub/time.series/oe";
const SOURCE_NAME = "U.S. Bureau of Labor Statistics OEWS";
const SOURCE_URL = `${BLS_BASE_URL}/`;
const BATCH_SIZE = 500;

type DataTypeKey =
  | "employment"
  | "annual_mean"
  | "annual_p10"
  | "annual_p25"
  | "annual_median"
  | "annual_p75"
  | "annual_p90"
  | "hourly_median";

type AreaRow = {
  area_type: string;
  area_code: string;
  area_name: string;
  state_code: string | null;
};

type OccupationRow = {
  occupation_code: string;
  occupation_name: string;
};

type SalaryRow = {
  release_period: string;
  release_year: number;
  occupation_code: string;
  occupation_name: string;
  area_type: string;
  area_code: string;
  area_name: string;
  state_code: string | null;
  employment: number | null;
  annual_mean: number | null;
  annual_p10: number | null;
  annual_p25: number | null;
  annual_median: number | null;
  annual_p75: number | null;
  annual_p90: number | null;
  hourly_median: number | null;
  source_name: string;
  source_url: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function selectedOccupationCodes() {
  const value = process.env.BLS_OEWS_OCCUPATION_CODES?.trim();

  if (!value || value.toLowerCase() === "all") {
    return null;
  }

  return new Set(
    value
      .split(",")
      .map((item) => item.trim().replace(/-/g, ""))
      .filter(Boolean),
  );
}

async function fetchText(filePath: string) {
  const response = await fetch(`${BLS_BASE_URL}/${filePath}`);

  if (!response.ok) {
    throw new Error(`Failed to download ${filePath}: ${response.status}`);
  }

  return response.text();
}

function parseTable(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split("\t").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split("\t");
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });

    return row;
  });
}

function dataTypeKey(label: string): DataTypeKey | null {
  const text = label.toLowerCase();

  if (text.includes("employment")) return "employment";
  if (text.includes("annual mean")) return "annual_mean";
  if (text.includes("annual") && text.includes("10th")) return "annual_p10";
  if (text.includes("annual") && text.includes("25th")) return "annual_p25";
  if (text.includes("annual") && text.includes("median"))
    return "annual_median";
  if (text.includes("annual") && text.includes("75th")) return "annual_p75";
  if (text.includes("annual") && text.includes("90th")) return "annual_p90";
  if (text.includes("hourly") && text.includes("median"))
    return "hourly_median";

  return null;
}

function parseNumber(value: string) {
  const cleaned = value.replace(/,/g, "").trim();

  if (
    !cleaned ||
    cleaned === "-" ||
    cleaned === "#" ||
    cleaned.toUpperCase() === "N/A"
  ) {
    return null;
  }

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

function decodeSeriesId(seriesId: string) {
  return {
    areaType: seriesId.slice(3, 4),
    areaCode: seriesId.slice(4, 11),
    industryCode: seriesId.slice(11, 17),
    occupationCode: seriesId.slice(17, 23),
    dataTypeCode: seriesId.slice(23, 25),
  };
}

async function loadLookupTables() {
  const [areaText, occupationText, dataTypeText] = await Promise.all([
    fetchText("oe.area"),
    fetchText("oe.occupation"),
    fetchText("oe.datatype"),
  ]);

  const areas = new Map<string, AreaRow>();
  for (const row of parseTable(areaText)) {
    const areaCode = row.area_code;
    if (!areaCode) continue;

    areas.set(areaCode, {
      area_type: row.areatype_code || row.area_type || "",
      area_code: areaCode,
      area_name: row.area_name,
      state_code: row.state_code || null,
    });
  }

  const occupations = new Map<string, OccupationRow>();
  for (const row of parseTable(occupationText)) {
    const occupationCode = row.occupation_code;
    if (!occupationCode) continue;

    occupations.set(occupationCode, {
      occupation_code: occupationCode,
      occupation_name: row.occupation_name,
    });
  }

  const dataTypes = new Map<string, DataTypeKey>();
  for (const row of parseTable(dataTypeText)) {
    const code = row.datatype_code;
    const label = row.datatype_text || row.datatype_name;
    const key = dataTypeKey(label);

    if (code && key) {
      dataTypes.set(code, key);
    }
  }

  return { areas, occupations, dataTypes };
}

async function upsertBatches(rows: SalaryRow[]) {
  let upserted = 0;

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);

    const { error } = await supabase.from("salary_benchmarks").upsert(batch, {
      onConflict: "release_year,occupation_code,area_code",
      ignoreDuplicates: false,
    });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }

    upserted += batch.length;
    console.log(`Upserted ${upserted}/${rows.length}`);
  }
}

async function main() {
  const selectedCodes = selectedOccupationCodes();
  const { areas, occupations, dataTypes } = await loadLookupTables();
  const dataText = await fetchText("oe.data.0.Current");
  const rowsByKey = new Map<string, SalaryRow>();

  for (const line of dataText.split(/\r?\n/)) {
    if (!line || line.startsWith("series_id")) continue;

    const [seriesId, yearRaw, period, valueRaw] = line.trim().split(/\s+/);
    if (!seriesId || !yearRaw || !period || !valueRaw) continue;

    const decoded = decodeSeriesId(seriesId);

    if (decoded.industryCode !== "000000") continue;
    if (selectedCodes && !selectedCodes.has(decoded.occupationCode)) continue;

    const dataType = dataTypes.get(decoded.dataTypeCode);
    if (!dataType) continue;

    const area = areas.get(decoded.areaCode);
    const occupation = occupations.get(decoded.occupationCode);
    const value = parseNumber(valueRaw);
    const releaseYear = Number(yearRaw);

    if (
      !area ||
      !occupation ||
      value === null ||
      !Number.isInteger(releaseYear)
    ) {
      continue;
    }

    const key = `${releaseYear}:${decoded.occupationCode}:${decoded.areaCode}`;
    const existing = rowsByKey.get(key) ?? {
      release_period: `May ${releaseYear}`,
      release_year: releaseYear,
      occupation_code: occupation.occupation_code,
      occupation_name: occupation.occupation_name,
      area_type: area.area_type || decoded.areaType,
      area_code: area.area_code,
      area_name: area.area_name,
      state_code: area.state_code,
      employment: null,
      annual_mean: null,
      annual_p10: null,
      annual_p25: null,
      annual_median: null,
      annual_p75: null,
      annual_p90: null,
      hourly_median: null,
      source_name: SOURCE_NAME,
      source_url: SOURCE_URL,
    };

    if (dataType === "hourly_median") {
      existing.hourly_median = value;
    } else {
      existing[dataType] = Math.round(value);
    }

    rowsByKey.set(key, existing);
  }

  const rows = Array.from(rowsByKey.values()).filter(
    (row) => row.annual_median,
  );

  await upsertBatches(rows);

  console.log(`Done. Seeded ${rows.length} BLS OEWS salary benchmark rows.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
