import "server-only";

import { redis } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const HIRING_COMPANIES_CACHE_TTL_SECONDS = 60 * 30; // 30 minutes
const HIRING_COMPANIES_CACHE_VERSION =
  process.env.HIRING_COMPANIES_CACHE_VERSION ?? "1";

const accents = [
  "from-[oklch(0.92_0.08_80)] to-[oklch(0.86_0.12_45)]",
  "from-[oklch(0.92_0.07_20)] to-[oklch(0.86_0.12_350)]",
  "from-[oklch(0.90_0.08_180)] to-[oklch(0.84_0.13_155)]",
  "from-[oklch(0.91_0.07_220)] to-[oklch(0.86_0.11_200)]",
  "from-[oklch(0.91_0.07_300)] to-[oklch(0.84_0.12_275)]",
  "from-[oklch(0.91_0.08_130)] to-[oklch(0.84_0.12_155)]",
];

type HiringCompanyRpcRow = {
  company_name: string | null;
  company_logo_url: string | null;
  company_size: string | null;
  company_website: string | null;
  industry: string | null;
  roles: number | string | null;
  new_roles: number | string | null;
  has_remote: boolean | null;
};

export type HiringCompany = {
  name: string;
  industry: string;
  roles: number;
  newRoles: number;
  size: string;
  tag: string;
  accent: string;
  logoUrl: string | null;
  website: string | null;
};

function getHiringCompaniesCacheKey(limit: number) {
  return `hiring-companies:${HIRING_COMPANIES_CACHE_VERSION}:limit:${limit}`;
}

function toCount(value: number | string | null | undefined) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function cleanText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") || null;
}

function companyTag(params: { newRoles: number; hasRemote: boolean }) {
  if (params.newRoles >= 10) return "Hiring fast";
  if (params.newRoles > 0) return `${params.newRoles} new this week`;
  if (params.hasRemote) return "Remote friendly";

  return "Actively hiring";
}

function toHiringCompany(
  row: HiringCompanyRpcRow,
  index: number,
): HiringCompany | null {
  const name = cleanText(row.company_name);

  if (!name) return null;

  const roles = toCount(row.roles);
  const newRoles = toCount(row.new_roles);
  const hasRemote = Boolean(row.has_remote);

  return {
    name,
    industry: cleanText(row.industry) ?? "Hiring",
    roles,
    newRoles,
    size: cleanText(row.company_size) ?? "Growing",
    tag: companyTag({ newRoles, hasRemote }),
    accent: accents[index % accents.length],
    logoUrl: cleanText(row.company_logo_url),
    website: cleanText(row.company_website),
  };
}

async function loadHiringCompaniesThisWeek(limit: number) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc("get_hiring_companies_this_week", {
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Could not load hiring companies: ${error.message}`);
  }

  return ((data ?? []) as HiringCompanyRpcRow[])
    .map(toHiringCompany)
    .filter((company): company is HiringCompany => Boolean(company));
}

export async function getHiringCompaniesThisWeek(limit = 6) {
  const safeLimit = Math.min(Math.max(limit, 1), 12);
  const cacheKey = getHiringCompaniesCacheKey(safeLimit);

  try {
    const cached = await redis.get<HiringCompany[]>(cacheKey);

    if (cached) {
      return cached;
    }
  } catch (error) {
    console.error("[hiring-this-week] Redis read failed. Continuing.", error);
  }

  const companies = await loadHiringCompaniesThisWeek(safeLimit);

  try {
    await redis.set(cacheKey, companies, {
      ex: HIRING_COMPANIES_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error("[hiring-this-week] Redis write failed. Continuing.", error);
  }

  return companies;
}
