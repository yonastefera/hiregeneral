import { createClient } from "@supabase/supabase-js";

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

type InsightJobRow = {
  id: string;
  title: string;
  category: string | null;
  skills: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  posted_at: string;
};

type BenchmarkSalaryRow = {
  release_year: number;
  occupation_code: string;
  occupation_name: string;
  area_type: string;
  annual_p10: number | null;
  annual_p25: number | null;
  annual_median: number | null;
  annual_p75: number | null;
  annual_p90: number | null;
};

type SalaryBucket = {
  role: string;
  terms: string[];
};

type BenchmarkSalaryBucket = {
  role: string;
  codes: string[];
};

type CategoryBucket = {
  name: string;
  query: string;
  icon: HomeMarketCategory["icon"];
  terms: string[];
};

const INSIGHT_LIMIT = 3000;
const HOURS_PER_YEAR = 2080;

const BENCHMARK_TABLES = ["salary_benchmarks", "salary_bls_oews"];

const salaryBuckets: SalaryBucket[] = [
  {
    role: "Software Engineer",
    terms: [
      "software engineer",
      "software developer",
      "full stack",
      "frontend",
      "front end",
      "backend",
      "back end",
      "application developer",
    ],
  },
  {
    role: "Data Engineer",
    terms: ["data engineer", "analytics engineer", "business intelligence"],
  },
  {
    role: "Product Designer",
    terms: [
      "product designer",
      "ux designer",
      "ui designer",
      "user experience",
    ],
  },
  {
    role: "Security Engineer",
    terms: [
      "security engineer",
      "cybersecurity",
      "cyber security",
      "security analyst",
    ],
  },
  {
    role: "Product Manager",
    terms: ["product manager", "technical product", "product owner"],
  },
  {
    role: "Cloud Engineer",
    terms: [
      "cloud engineer",
      "devops",
      "site reliability",
      "sre",
      "platform engineer",
    ],
  },
];

const benchmarkSalaryBuckets: BenchmarkSalaryBucket[] = [
  {
    role: "Software Engineer",
    codes: ["151252"],
  },
  {
    role: "Data Engineer",
    codes: ["152051", "151243", "151299"],
  },
  {
    role: "Security Engineer",
    codes: ["151212"],
  },
  {
    role: "Cloud Engineer",
    codes: ["151241", "151244", "151253"],
  },
];

const categoryBuckets: CategoryBucket[] = [
  {
    name: "Engineering",
    query: "software engineering",
    icon: "engineering",
    terms: [
      "engineer",
      "developer",
      "software",
      "frontend",
      "backend",
      "full stack",
      "platform",
      "devops",
      "sre",
    ],
  },
  {
    name: "Data & AI",
    query: "data ai",
    icon: "data",
    terms: [
      "data",
      "analytics",
      "machine learning",
      "artificial intelligence",
      "ai",
      "bi",
      "scientist",
    ],
  },
  {
    name: "Design",
    query: "product design",
    icon: "design",
    terms: ["designer", "design", "ux", "ui", "user experience", "creative"],
  },
  {
    name: "Security",
    query: "security",
    icon: "operations",
    terms: ["security", "cyber", "risk", "compliance", "privacy"],
  },
  {
    name: "Product",
    query: "product manager",
    icon: "operations",
    terms: ["product", "program manager", "project manager", "scrum", "agile"],
  },
  {
    name: "Healthcare Tech",
    query: "healthcare technology",
    icon: "healthcare",
    terms: [
      "health",
      "clinical",
      "medical",
      "pharmacy",
      "patient",
      "healthcare",
    ],
  },
  {
    name: "Marketing Tech",
    query: "marketing technology",
    icon: "marketing",
    terms: ["marketing", "growth", "crm", "campaign", "seo", "content"],
  },
];

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

function searchableText(job: InsightJobRow) {
  return [
    job.title,
    job.category,
    ...(Array.isArray(job.skills) ? job.skills : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function normalizeSalaryValue(value: number | null) {
  if (!value || value <= 0) return null;

  if (value <= 300) return Math.round(value * HOURS_PER_YEAR);

  if (value < 10_000 || value > 1_000_000) return null;

  return Math.round(value);
}

function salaryRange(job: InsightJobRow) {
  const low = normalizeSalaryValue(job.salary_min ?? job.salary_max);
  const high = normalizeSalaryValue(job.salary_max ?? job.salary_min);

  if (!low || !high) return null;

  return {
    low: Math.min(low, high),
    high: Math.max(low, high),
    midpoint: Math.round((low + high) / 2),
  };
}

function percentile(values: number[], target: number) {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * target;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  return Math.round(
    sorted[lower] * (1 - (index - lower)) + sorted[upper] * (index - lower),
  );
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

  const sorted = [...values].sort((a, b) => a - b);
  const chunks = Array.from({ length: 7 }, (_, index) => {
    const start = Math.floor((index / 7) * sorted.length);
    const end = Math.max(
      start + 1,
      Math.floor(((index + 1) / 7) * sorted.length),
    );
    const slice = sorted.slice(start, end);
    const avg = slice.reduce((sum, value) => sum + value, 0) / slice.length;

    return Math.round(avg);
  });
  const min = Math.min(...chunks);
  const max = Math.max(...chunks);

  if (min === max) return chunks.map(() => 32);

  return chunks.map(
    (value) => 18 + Math.round(((value - min) / (max - min)) * 30),
  );
}

function compactCode(value: string) {
  return value.replace(/\D/g, "");
}

function benchmarkSparkline(row: BenchmarkSalaryRow) {
  const values = [
    row.annual_p10,
    row.annual_p25,
    row.annual_median,
    row.annual_p75,
    row.annual_p90,
  ].filter((value): value is number => typeof value === "number" && value > 0);

  return buildSparkline(values);
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

function buildSalaryBands(jobs: InsightJobRow[]) {
  const bands = salaryBuckets
    .map((bucket) => {
      const ranges = jobs
        .filter((job) => matchesAny(searchableText(job), bucket.terms))
        .map(salaryRange)
        .filter((range): range is NonNullable<typeof range> => Boolean(range));

      if (ranges.length < 1) return null;

      const low = percentile(
        ranges.map((range) => range.low),
        0.25,
      );
      const high = percentile(
        ranges.map((range) => range.high),
        0.75,
      );

      if (!low || !high) return null;

      return {
        role: bucket.role,
        range: `${formatCompactCurrency(low)} - ${formatCompactCurrency(high)}`,
        trend: formatRoleCount(ranges.length),
        spark: buildSparkline(ranges.map((range) => range.midpoint)),
        sampleCount: ranges.length,
      };
    })
    .filter(
      (
        band,
      ): band is HomeSalaryBand & {
        sampleCount: number;
      } => Boolean(band),
    )
    .sort((a, b) => b.sampleCount - a.sampleCount)
    .slice(0, 4)
    .map((band) => ({
      role: band.role,
      range: band.range,
      trend: band.trend,
      spark: band.spark,
    }));

  return bands;
}

function buildMarketCategories(jobs: InsightJobRow[]) {
  const categories = categoryBuckets
    .map((bucket) => {
      const count = jobs.filter((job) =>
        matchesAny(searchableText(job), bucket.terms),
      ).length;

      return {
        name: bucket.name,
        count: formatRoleCount(count),
        query: bucket.query,
        icon: bucket.icon,
        rawCount: count,
      };
    })
    .filter((category) => category.rawCount > 0)
    .sort((a, b) => b.rawCount - a.rawCount)
    .slice(0, 6)
    .map((category) => ({
      name: category.name,
      count: category.count,
      query: category.query,
      icon: category.icon,
    }));

  if (categories.length > 0) return categories;

  const counts = jobs.reduce((acc, job) => {
    const category = job.category?.trim();
    if (!category) return acc;

    acc.set(category, (acc.get(category) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count: formatRoleCount(count),
      query: name,
      icon: "operations" as const,
    }));
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
          "release_year, occupation_code, occupation_name, area_type, annual_p10, annual_p25, annual_median, annual_p75, annual_p90",
        )
        .eq("release_year", latestYear)
        .eq("area_type", "N")
        .in("occupation_code", queryCodes)
        .not("annual_median", "is", null);

      if (error) {
        if (error.code === "42P01") continue;
        throw new Error(error.message);
      }

      const rows = ((data ?? []) as BenchmarkSalaryRow[]).map((row) => ({
        ...row,
        occupation_code: compactCode(row.occupation_code),
      }));
      const bands = buildBenchmarkSalaryBands(rows);

      if (bands.length > 0) return bands;
    } catch (error) {
      console.error(`[loadBenchmarkSalaryBands:${tableName}]`, error);
    }
  }

  return [];
}

export async function loadHomeInsights(): Promise<{
  salaryBands: HomeSalaryBand[];
  marketCategories: HomeMarketCategory[];
}> {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return {
      salaryBands: [],
      marketCategories: [],
    };
  }

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("id, title, category, skills, salary_min, salary_max, posted_at")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("posted_at", { ascending: false })
    .limit(INSIGHT_LIMIT);

  if (error) {
    console.error("[loadHomeInsights]", error.message);

    return {
      salaryBands: await loadBenchmarkSalaryBands(supabaseAdmin),
      marketCategories: [],
    };
  }

  const jobs = (data ?? []) as InsightJobRow[];
  const jobSalaryBands = buildSalaryBands(jobs);

  return {
    salaryBands:
      jobSalaryBands.length > 0
        ? jobSalaryBands
        : await loadBenchmarkSalaryBands(supabaseAdmin),
    marketCategories: buildMarketCategories(jobs),
  };
}
