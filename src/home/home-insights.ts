import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

export type HomeSalaryBand = {
  role: string;
  range: string;
  trend: string;
  spark: number[];
};

export type HomeMarketCategory = {
  name: string;
  count: string;
  query: string;
  icon:
    | "engineering"
    | "design"
    | "data"
    | "marketing"
    | "operations"
    | "healthcare";
};

type AggregatedSalaryBand = {
  role: unknown;
  low: unknown;
  high: unknown;
  sampleCount: unknown;
  sparkValues: unknown;
};

type AggregatedMarketCategory = {
  name: unknown;
  query: unknown;
  icon: unknown;
  jobCount: unknown;
};

type AggregatedInsights = {
  salaryBands?: unknown;
  marketCategories?: unknown;
};

type BenchmarkSalaryRow = {
  release_year: number;
  occupation_code: string;
  annual_p10: number | null;
  annual_p25: number | null;
  annual_median: number | null;
  annual_p75: number | null;
  annual_p90: number | null;
};

const BENCHMARK_TABLES = ["salary_benchmarks", "salary_bls_oews"];
const VALID_CATEGORY_ICONS = new Set<HomeMarketCategory["icon"]>([
  "engineering",
  "design",
  "data",
  "marketing",
  "operations",
  "healthcare",
]);
const benchmarkSalaryBuckets = [
  { role: "Software Engineer", codes: ["151252"] },
  { role: "Data Engineer", codes: ["152051", "151243", "151299"] },
  { role: "Security Engineer", codes: ["151212"] },
  { role: "Cloud Engineer", codes: ["151241", "151244", "151253"] },
];

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

function finiteNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatCompactCurrency(value: number) {
  return `$${Math.round(value / 1000)}k`;
}

function formatRoleCount(value: number) {
  return `${new Intl.NumberFormat("en-US").format(value)} ${
    value === 1 ? "role" : "roles"
  }`;
}

function buildSparkline(values: number[]) {
  if (values.length === 0) return [18, 22, 26, 28, 30, 34, 38];

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return values.map(() => 32);

  return values.map(
    (value) => 18 + Math.round(((value - min) / (max - min)) * 30),
  );
}

function compactCode(value: string) {
  return value.replace(/\D/g, "");
}

function benchmarkSparkline(row: BenchmarkSalaryRow) {
  return buildSparkline(
    [
      row.annual_p10,
      row.annual_p25,
      row.annual_median,
      row.annual_p75,
      row.annual_p90,
    ].filter(
      (value): value is number => typeof value === "number" && value > 0,
    ),
  );
}

function benchmarkRange(row: BenchmarkSalaryRow) {
  const median = row.annual_median;
  const low = row.annual_p25 ?? (median ? Math.round(median * 0.85) : null);
  const high = row.annual_p75 ?? (median ? Math.round(median * 1.15) : null);

  if (!low || !high) return null;

  return `${formatCompactCurrency(low)} - ${formatCompactCurrency(high)}`;
}

function buildBenchmarkSalaryBands(rows: BenchmarkSalaryRow[]) {
  return benchmarkSalaryBuckets
    .map((bucket) => {
      const row = rows.find((candidate) =>
        bucket.codes.includes(compactCode(candidate.occupation_code)),
      );
      const range = row ? benchmarkRange(row) : null;
      if (!row || !range) return null;

      return {
        role: bucket.role,
        range,
        trend: `BLS ${row.release_year}`,
        spark: benchmarkSparkline(row),
      };
    })
    .filter((band): band is HomeSalaryBand => Boolean(band))
    .slice(0, 4);
}

function mapAggregatedSalaryBands(value: unknown): HomeSalaryBand[] {
  if (!Array.isArray(value)) return [];

  return (value as AggregatedSalaryBand[])
    .map((row) => {
      const low = finiteNumber(row.low);
      const high = finiteNumber(row.high);
      const sampleCount = finiteNumber(row.sampleCount);
      const sparkValues = Array.isArray(row.sparkValues)
        ? row.sparkValues
            .map(finiteNumber)
            .filter((item): item is number => item !== null)
        : [];

      if (
        typeof row.role !== "string" ||
        low === null ||
        high === null ||
        sampleCount === null
      ) {
        return null;
      }

      return {
        role: row.role,
        range: `${formatCompactCurrency(low)} - ${formatCompactCurrency(high)}`,
        trend: formatRoleCount(sampleCount),
        spark: buildSparkline(sparkValues),
      };
    })
    .filter((band): band is HomeSalaryBand => band !== null);
}

function mapAggregatedCategories(value: unknown): HomeMarketCategory[] {
  if (!Array.isArray(value)) return [];

  return (value as AggregatedMarketCategory[])
    .map((row) => {
      const count = finiteNumber(row.jobCount);
      if (
        typeof row.name !== "string" ||
        typeof row.query !== "string" ||
        typeof row.icon !== "string" ||
        !VALID_CATEGORY_ICONS.has(row.icon as HomeMarketCategory["icon"]) ||
        count === null
      ) {
        return null;
      }

      return {
        name: row.name,
        query: row.query,
        icon: row.icon as HomeMarketCategory["icon"],
        count: formatRoleCount(count),
      };
    })
    .filter((category): category is HomeMarketCategory => category !== null);
}

async function latestBenchmarkYear(
  supabaseAdmin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  tableName: string,
) {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select("release_year")
    .not("annual_median", "is", null)
    .order("release_year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return null;
    throw new Error(error.message);
  }

  return data?.release_year ?? null;
}

async function loadBenchmarkSalaryBands(
  supabaseAdmin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
) {
  const codes = benchmarkSalaryBuckets.flatMap((bucket) => bucket.codes);
  const queryCodes = codes.flatMap((code) => [
    code,
    `${code.slice(0, 2)}-${code.slice(2)}`,
  ]);

  for (const tableName of BENCHMARK_TABLES) {
    try {
      const latestYear = await latestBenchmarkYear(supabaseAdmin, tableName);
      if (!latestYear) continue;

      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select(
          "release_year, occupation_code, annual_p10, annual_p25, annual_median, annual_p75, annual_p90",
        )
        .eq("release_year", latestYear)
        .eq("area_type", "N")
        .in("occupation_code", queryCodes)
        .not("annual_median", "is", null);

      if (error) {
        if (error.code === "42P01") continue;
        throw new Error(error.message);
      }

      const bands = buildBenchmarkSalaryBands(
        (data ?? []) as BenchmarkSalaryRow[],
      );
      if (bands.length > 0) return bands;
    } catch (error) {
      console.error(`[loadBenchmarkSalaryBands:${tableName}]`, error);
    }
  }

  return [];
}

async function safeLoadBenchmarkSalaryBands(
  supabaseAdmin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
) {
  try {
    return await loadBenchmarkSalaryBands(supabaseAdmin);
  } catch (error) {
    console.error("[safeLoadBenchmarkSalaryBands]", error);
    return [];
  }
}

async function loadHomeInsightsUncached(): Promise<{
  salaryBands: HomeSalaryBand[];
  marketCategories: HomeMarketCategory[];
}> {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return { salaryBands: [], marketCategories: [] };

  try {
    const { data, error } = await supabaseAdmin.rpc("get_home_insights_public");
    if (error) throw new Error(error.message);

    const payload = (data ?? {}) as AggregatedInsights;
    const salaryBands = mapAggregatedSalaryBands(payload.salaryBands);

    return {
      salaryBands:
        salaryBands.length > 0
          ? salaryBands
          : await safeLoadBenchmarkSalaryBands(supabaseAdmin),
      marketCategories: mapAggregatedCategories(payload.marketCategories),
    };
  } catch (error) {
    console.error("[loadHomeInsights:aggregate]", error);

    return {
      salaryBands: await safeLoadBenchmarkSalaryBands(supabaseAdmin),
      marketCategories: [],
    };
  }
}

export const loadHomeInsights = unstable_cache(
  loadHomeInsightsUncached,
  ["home-insights-v2"],
  {
    revalidate: 3600,
    tags: ["home-insights"],
  },
);
