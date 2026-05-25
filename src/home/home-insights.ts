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

type SalaryBucket = {
  role: string;
  terms: string[];
};

type CategoryBucket = {
  name: string;
  query: string;
  icon: HomeMarketCategory["icon"];
  terms: string[];
};

const INSIGHT_LIMIT = 3000;
const HOURS_PER_YEAR = 2080;

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

const fallbackSalaryBands: HomeSalaryBand[] = [
  {
    role: "Software Engineer",
    range: "$90k - $180k",
    trend: "Market sample",
    spark: [20, 28, 24, 36, 32, 44, 48],
  },
  {
    role: "Data Engineer",
    range: "$95k - $170k",
    trend: "Market sample",
    spark: [18, 22, 28, 26, 34, 38, 46],
  },
  {
    role: "Product Designer",
    range: "$85k - $155k",
    trend: "Market sample",
    spark: [22, 26, 24, 30, 28, 32, 36],
  },
  {
    role: "Security Engineer",
    range: "$100k - $190k",
    trend: "Market sample",
    spark: [16, 24, 22, 30, 36, 32, 42],
  },
];

const fallbackMarketCategories: HomeMarketCategory[] = [
  {
    name: "Engineering",
    count: "Browse roles",
    query: "software engineering",
    icon: "engineering",
  },
  {
    name: "Data & AI",
    count: "Browse roles",
    query: "data ai",
    icon: "data",
  },
  {
    name: "Design",
    count: "Browse roles",
    query: "product design",
    icon: "design",
  },
  {
    name: "Product",
    count: "Browse roles",
    query: "product manager",
    icon: "operations",
  },
  {
    name: "Healthcare Tech",
    count: "Browse roles",
    query: "healthcare technology",
    icon: "healthcare",
  },
  {
    name: "Marketing Tech",
    count: "Browse roles",
    query: "marketing technology",
    icon: "marketing",
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

function buildSalaryBands(jobs: InsightJobRow[]) {
  const bands = salaryBuckets
    .map((bucket) => {
      const ranges = jobs
        .filter((job) => matchesAny(searchableText(job), bucket.terms))
        .map(salaryRange)
        .filter((range): range is NonNullable<typeof range> => Boolean(range));

      if (ranges.length < 2) return null;

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

  return bands.length > 0 ? bands : fallbackSalaryBands;
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

  return categories.length > 0 ? categories : fallbackMarketCategories;
}

export async function loadHomeInsights(): Promise<{
  salaryBands: HomeSalaryBand[];
  marketCategories: HomeMarketCategory[];
}> {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return {
      salaryBands: fallbackSalaryBands,
      marketCategories: fallbackMarketCategories,
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
    throw new Error(error.message);
  }

  const jobs = (data ?? []) as InsightJobRow[];

  return {
    salaryBands: buildSalaryBands(jobs),
    marketCategories: buildMarketCategories(jobs),
  };
}
