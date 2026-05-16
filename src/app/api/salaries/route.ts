import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  US_STATE_NAMES_BY_ABBR,
  normalizeUsStateRegion,
} from "@/lib/location/us-states";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SAMPLE_LIMIT = 500;
const HOURS_PER_YEAR = 2080;

type SalaryJobRow = {
  id: string;
  company_name: string;
  title: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  posted_at: string;
  slug: string | null;
};

type BlsSalaryRow = {
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

type SalarySample = {
  id: string;
  companyName: string;
  title: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  midpoint: number;
  source: "job_posting";
  url: string | null;
};

const BLS_SALARY_SELECT = `
  release_period,
  release_year,
  occupation_code,
  occupation_name,
  area_type,
  area_code,
  area_name,
  state_code,
  employment,
  annual_mean,
  annual_p10,
  annual_p25,
  annual_median,
  annual_p75,
  annual_p90,
  hourly_median,
  source_name,
  source_url
`;

const OCCUPATION_ALIASES = [
  {
    codes: ["151252"],
    terms: [
      "software engineer",
      "software developer",
      "application developer",
      "developer",
      "backend",
      "back end",
      "full stack",
      "full-stack",
      "platform engineer",
    ],
  },
  {
    codes: ["151254", "151255"],
    terms: [
      "frontend",
      "front end",
      "front-end",
      "web developer",
      "ui developer",
      "user interface",
      "react",
      "angular",
      "web designer",
      "digital interface",
      "ux designer",
      "product designer",
    ],
  },
  {
    codes: ["152051"],
    terms: ["data scientist", "machine learning", "ai engineer", "ml engineer"],
  },
  {
    codes: ["151299", "151252", "151243"],
    terms: [
      "data engineer",
      "analytics engineer",
      "etl",
      "business intelligence",
      "bi engineer",
    ],
  },
  {
    codes: ["151212"],
    terms: [
      "cybersecurity",
      "security analyst",
      "information security",
      "security engineer",
    ],
  },
  {
    codes: ["151241", "151244", "151253"],
    terms: [
      "devops",
      "sre",
      "site reliability",
      "cloud engineer",
      "systems engineer",
      "network engineer",
      "qa engineer",
      "test engineer",
    ],
  },
  {
    codes: ["151211"],
    terms: [
      "systems analyst",
      "business analyst",
      "technical analyst",
      "application analyst",
    ],
  },

  // Product / project / operations / management
  {
    codes: ["113021"],
    terms: ["technology manager", "it manager", "engineering manager"],
  },
  {
    codes: ["131082"],
    terms: [
      "project manager",
      "program manager",
      "project management specialist",
    ],
  },
  {
    codes: ["131111"],
    terms: ["management analyst", "consultant", "business consultant"],
  },
  {
    codes: ["111021"],
    terms: [
      "operations manager",
      "general manager",
      "business operations manager",
    ],
  },
  {
    codes: ["119199"],
    terms: ["product manager", "product owner"],
  },

  // Finance / accounting
  {
    codes: ["132011"],
    terms: ["accountant", "auditor", "accounting"],
  },
  {
    codes: ["132051"],
    terms: ["financial analyst", "investment analyst", "finance analyst"],
  },
  {
    codes: ["132054"],
    terms: ["risk analyst", "financial risk"],
  },
  {
    codes: ["132031"],
    terms: ["budget analyst"],
  },

  // HR
  {
    codes: ["131071"],
    terms: [
      "hr specialist",
      "human resources specialist",
      "recruiter",
      "talent acquisition",
    ],
  },
  {
    codes: ["113121"],
    terms: ["hr manager", "human resources manager"],
  },
  {
    codes: ["131151"],
    terms: ["training specialist", "learning and development"],
  },

  // Engineering
  {
    codes: ["172051"],
    terms: ["civil engineer"],
  },
  {
    codes: ["172141"],
    terms: ["mechanical engineer"],
  },
  {
    codes: ["172071"],
    terms: ["electrical engineer"],
  },
  {
    codes: ["172061"],
    terms: ["computer hardware engineer", "hardware engineer"],
  },
  {
    codes: ["172011"],
    terms: ["aerospace engineer"],
  },
  {
    codes: ["172041"],
    terms: ["chemical engineer"],
  },
  {
    codes: ["172112"],
    terms: ["industrial engineer"],
  },
  {
    codes: ["172031"],
    terms: ["biomedical engineer", "bioengineer"],
  },

  // Healthcare: nurses, PAs, doctors
  {
    codes: ["291141"],
    terms: ["registered nurse", "rn", "nurse"],
  },
  {
    codes: ["291171"],
    terms: ["nurse practitioner", "np"],
  },
  {
    codes: ["291151"],
    terms: ["nurse anesthetist", "crna"],
  },
  {
    codes: ["291071"],
    terms: ["physician assistant", "pa"],
  },
  {
    codes: ["291229"],
    terms: ["doctor", "physician", "medical doctor", "md"],
  },
  {
    codes: ["291215"],
    terms: [
      "family physician",
      "family medicine physician",
      "primary care doctor",
    ],
  },
  {
    codes: ["291214"],
    terms: ["emergency physician", "emergency medicine doctor"],
  },
  {
    codes: ["291212"],
    terms: ["cardiologist"],
  },
  {
    codes: ["291217"],
    terms: ["neurologist"],
  },
  {
    codes: ["291223"],
    terms: ["psychiatrist"],
  },
  {
    codes: ["291051"],
    terms: ["pharmacist"],
  },
  {
    codes: ["291123"],
    terms: ["physical therapist", "pt"],
  },
  {
    codes: ["291122"],
    terms: ["occupational therapist"],
  },
  {
    codes: ["292034"],
    terms: [
      "radiologic technologist",
      "radiology tech",
      "xray tech",
      "x-ray tech",
    ],
  },
  {
    codes: ["292035"],
    terms: ["mri technologist", "mri tech"],
  },

  // Support
  {
    codes: ["151232", "151231"],
    terms: [
      "technical support",
      "help desk",
      "support engineer",
      "customer support technical",
    ],
  },
];

const OCCUPATION_BENCHMARKS = [
  {
    terms: ["software engineer", "software developer", "developer"],
    base: 132000,
  },
  { terms: ["frontend", "front end", "react", "ui developer"], base: 124000 },
  { terms: ["full stack", "full-stack"], base: 134000 },
  { terms: ["data engineer"], base: 128000 },
  {
    terms: ["data scientist", "machine learning", "ai engineer"],
    base: 140000,
  },
  {
    terms: ["devops", "site reliability", "sre", "cloud engineer"],
    base: 138000,
  },
  { terms: ["product manager"], base: 142000 },
  { terms: ["business analyst", "systems analyst"], base: 96000 },
  { terms: ["ux", "user experience", "product designer"], base: 112000 },
  { terms: ["qa", "quality assurance", "test engineer"], base: 98000 },
];

const LOCATION_MULTIPLIERS = [
  { terms: ["san francisco", "bay area", "san jose"], value: 1.34 },
  { terms: ["new york", "nyc"], value: 1.24 },
  { terms: ["seattle"], value: 1.19 },
  { terms: ["boston"], value: 1.15 },
  { terms: ["los angeles"], value: 1.12 },
  { terms: ["washington", "dc", "arlington"], value: 1.11 },
  { terms: ["chicago"], value: 1.06 },
  { terms: ["austin"], value: 1.05 },
  { terms: ["dallas", "plano"], value: 1.02 },
  { terms: ["atlanta"], value: 1.01 },
  { terms: ["charlotte"], value: 0.98 },
  { terms: ["remote", "united states"], value: 1 },
];

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function escapeIlikeValue(value: string) {
  return value.replace(/[%_]/g, "\\$&").replace(/,/g, " ");
}

function searchTokens(value: string) {
  return Array.from(new Set(normalize(value).split(" ")))
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .slice(0, 6);
}

function parseLocation(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { city: "", stateAbbr: "", stateName: "" };
  }

  const [cityPart, statePart] = trimmed.split(",").map((part) => part.trim());
  const normalizedRegion = normalizeUsStateRegion(statePart || null);

  const stateAbbr =
    normalizedRegion && normalizedRegion.length === 2
      ? normalizedRegion.toUpperCase()
      : "";

  return {
    city: cityPart || "",
    stateAbbr,
    stateName: stateAbbr
      ? (US_STATE_NAMES_BY_ABBR[stateAbbr] ?? "")
      : (normalizedRegion ?? ""),
  };
}

function occupationCodesForCareer(career: string) {
  const text = normalize(career);
  const codes = new Set<string>();

  for (const item of OCCUPATION_ALIASES) {
    if (item.terms.some((term) => text.includes(term))) {
      item.codes.forEach((code) => codes.add(code));
    }
  }

  return Array.from(codes);
}

function scoreBlsRow(row: BlsSalaryRow, location: string) {
  const normalizedLocation = normalize(location);
  const area = normalize(row.area_name);
  const { city, stateAbbr, stateName } = parseLocation(location);
  const cityText = normalize(city);
  const stateText = normalize(stateName);

  if (
    !normalizedLocation ||
    normalizedLocation === "remote" ||
    normalizedLocation === "united states"
  ) {
    return row.area_type === "N" ? 100 : 20;
  }

  if (
    cityText &&
    area.includes(cityText) &&
    stateAbbr &&
    area.includes(stateAbbr.toLowerCase())
  )
    return 120;
  if (
    cityText &&
    area.includes(cityText) &&
    stateText &&
    area.includes(stateText)
  )
    return 110;
  if (cityText && area.includes(cityText)) return 90;
  if (stateText && area === stateText) return 80;
  if (stateText && area.includes(stateText)) return 60;

  return row.area_type === "N" ? 10 : 0;
}

function areaTypeRank(areaType: string) {
  if (areaType === "M") return 3;
  if (areaType === "S") return 2;
  if (areaType === "N") return 1;
  return 0;
}

async function latestBenchmarkReleaseYear() {
  const { data, error } = await supabaseAdmin
    .from("salary_benchmarks")
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

async function findBlsSalary(career: string, location: string) {
  const latestYear = await latestBenchmarkReleaseYear();

  if (!latestYear) {
    return null;
  }

  const codes = occupationCodesForCareer(career);
  const tokens = searchTokens(career);

  let query = supabaseAdmin
    .from("salary_benchmarks")
    .select(BLS_SALARY_SELECT)
    .eq("release_year", latestYear)
    .not("annual_median", "is", null)
    .limit(5000);

  if (codes.length > 0) {
    query = query.in("occupation_code", codes);
  } else if (tokens.length > 0) {
    query = query.or(
      tokens
        .slice(0, 4)
        .map(
          (token) =>
            `occupation_search_text.ilike.%${escapeIlikeValue(token)}%`,
        )
        .join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "42P01") return null;
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as unknown as BlsSalaryRow[])
    .map((row) => ({ row, score: scoreBlsRow(row, location) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return areaTypeRank(b.row.area_type) - areaTypeRank(a.row.area_type);
    });

  return rows[0]?.row ?? null;
}

function normalizeSalary(row: SalaryJobRow): SalarySample | null {
  const low = row.salary_min ?? row.salary_max;
  const high = row.salary_max ?? row.salary_min;

  if (!low || !high || low <= 0 || high <= 0) return null;

  let salaryMin = Math.min(low, high);
  let salaryMax = Math.max(low, high);

  if (salaryMax <= 300) {
    salaryMin *= HOURS_PER_YEAR;
    salaryMax *= HOURS_PER_YEAR;
  }

  if (salaryMax < 10000 || salaryMin > 1000000) return null;

  return {
    id: row.id,
    companyName: row.company_name,
    title: row.title,
    location: row.location,
    salaryMin: Math.round(salaryMin),
    salaryMax: Math.round(salaryMax),
    midpoint: Math.round((salaryMin + salaryMax) / 2),
    source: "job_posting",
    url: row.slug ? `/jobs/${row.slug}` : null,
  };
}

function percentile(values: number[], target: number) {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];

  const index = (values.length - 1) * target;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return values[lower];

  const weight = index - lower;
  return Math.round(values[lower] * (1 - weight) + values[upper] * weight);
}

function fallbackBenchmark(career: string, location: string) {
  const careerText = normalize(career);
  const locationText = normalize(location);
  const occupation =
    OCCUPATION_BENCHMARKS.find((item) =>
      item.terms.some((term) => careerText.includes(term)),
    ) ?? OCCUPATION_BENCHMARKS[0];

  const multiplier =
    LOCATION_MULTIPLIERS.find((item) =>
      item.terms.some((term) => locationText.includes(term)),
    )?.value ?? 1;

  const median = Math.round(occupation.base * multiplier);

  return {
    low: Math.round(median * 0.82),
    median,
    high: Math.round(median * 1.22),
  };
}

async function loadJobSalarySamples(career: string, location: string) {
  const tokens = searchTokens(career);
  const keywordFilter = [
    `title.ilike.%${escapeIlikeValue(career)}%`,
    ...tokens.map((token) => `search_text.ilike.%${escapeIlikeValue(token)}%`),
  ].join(",");

  let query = supabaseAdmin
    .from("jobs")
    .select(
      "id, company_name, title, location, salary_min, salary_max, salary_currency, posted_at, slug",
    )
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .or("salary_min.not.is.null,salary_max.not.is.null")
    .limit(SAMPLE_LIMIT);

  if (keywordFilter) {
    query = query.or(keywordFilter);
  }

  const loc = parseLocation(location).city || location.split(",")[0]?.trim();

  if (loc) {
    query = query.ilike("location", `%${escapeIlikeValue(loc)}%`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return ((data ?? []) as SalaryJobRow[])
    .map(normalizeSalary)
    .filter((sample): sample is SalarySample => Boolean(sample))
    .sort((a, b) => a.midpoint - b.midpoint);
}

function formatCurrency(value: number | null) {
  if (value === null) return null;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function responseRange(
  low: number | null,
  median: number | null,
  high: number | null,
) {
  return {
    low,
    median,
    high,
    formattedLow: formatCurrency(low),
    formattedMedian: formatCurrency(median),
    formattedHigh: formatCurrency(high),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const career = searchParams.get("career")?.trim() ?? "";
    const location = searchParams.get("location")?.trim() ?? "";

    if (!career) {
      return NextResponse.json(
        { error: "Career name is required." },
        { status: 400 },
      );
    }

    const [blsSalary, samples] = await Promise.all([
      findBlsSalary(career, location),
      loadJobSalarySamples(career, location),
    ]);

    if (blsSalary) {
      const low = blsSalary.annual_p10 ?? blsSalary.annual_p25 ?? null;
      const median = blsSalary.annual_median;
      const high = blsSalary.annual_p90 ?? blsSalary.annual_p75 ?? null;

      return NextResponse.json({
        career,
        location: location || blsSalary.area_name,
        source: "bls_oews",
        dataSource: `${blsSalary.source_name} ${blsSalary.release_period}`,
        sampleCount: samples.length,
        confidence: "high",
        range: responseRange(low, median, high),
        bls: {
          occupationCode: blsSalary.occupation_code,
          occupationName: blsSalary.occupation_name,
          areaName: blsSalary.area_name,
          releasePeriod: blsSalary.release_period,
          employment: blsSalary.employment,
          annualMean: blsSalary.annual_mean,
          annualP25: blsSalary.annual_p25,
          annualP75: blsSalary.annual_p75,
          hourlyMedian: blsSalary.hourly_median,
          sourceName: blsSalary.source_name,
          sourceUrl: blsSalary.source_url,
        },
        samples: samples
          .slice(-8)
          .reverse()
          .map((sample) => ({
            ...sample,
            formattedSalaryMin: formatCurrency(sample.salaryMin),
            formattedSalaryMax: formatCurrency(sample.salaryMax),
          })),
      });
    }

    const midpoints = samples.map((sample) => sample.midpoint);
    const fallback = fallbackBenchmark(career, location);
    const hasStrongSample = samples.length >= 5;
    const low = hasStrongSample ? percentile(midpoints, 0.25) : fallback.low;
    const median = hasStrongSample
      ? percentile(midpoints, 0.5)
      : fallback.median;
    const high = hasStrongSample ? percentile(midpoints, 0.75) : fallback.high;

    return NextResponse.json({
      career,
      location: location || "United States",
      source: hasStrongSample ? "hiregeneral" : "benchmark",
      dataSource: hasStrongSample
        ? "HireGeneral active salary postings"
        : "Benchmark estimate based on available salary data",
      sampleCount: samples.length,
      confidence:
        samples.length >= 20
          ? "high"
          : samples.length >= 5
            ? "medium"
            : "benchmark",
      range: responseRange(low, median, high),
      bls: null,
      samples: samples
        .slice(-8)
        .reverse()
        .map((sample) => ({
          ...sample,
          formattedSalaryMin: formatCurrency(sample.salaryMin),
          formattedSalaryMax: formatCurrency(sample.salaryMax),
        })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not calculate salary estimate.",
      },
      { status: 500 },
    );
  }
}
