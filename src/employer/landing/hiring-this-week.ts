import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ONE_DAY_MS = 86_400_000;
const MAX_COMPANY_ROWS = 5000;

const accents = [
  "from-[oklch(0.92_0.08_80)] to-[oklch(0.86_0.12_45)]",
  "from-[oklch(0.92_0.07_20)] to-[oklch(0.86_0.12_350)]",
  "from-[oklch(0.90_0.08_180)] to-[oklch(0.84_0.13_155)]",
  "from-[oklch(0.91_0.07_220)] to-[oklch(0.86_0.11_200)]",
  "from-[oklch(0.91_0.07_300)] to-[oklch(0.84_0.12_275)]",
  "from-[oklch(0.91_0.08_130)] to-[oklch(0.84_0.12_155)]",
];

type CompanyJobRow = {
  company_name: string | null;
  company_logo_url: string | null;
  company_size: string | null;
  company_website: string | null;
  category: string | null;
  work_mode: string | null;
  posted_at: string | null;
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

function mostCommon(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const normalized = value?.trim();

    if (!normalized) continue;

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return (
    [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0]?.[0] ?? null
  );
}

function companyTag(params: { newRoles: number; workModes: string[] }) {
  const hasRemote = params.workModes.some((mode) =>
    mode.toLowerCase().includes("remote"),
  );

  if (params.newRoles >= 10) return "Hiring fast";
  if (params.newRoles > 0) return `${params.newRoles} new this week`;
  if (hasRemote) return "Remote friendly";

  return "Actively hiring";
}

export async function getHiringCompaniesThisWeek(limit = 6) {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * ONE_DAY_MS);

  const { data, error } = await supabase
    .from("jobs")
    .select(
      "company_name, company_logo_url, company_size, company_website, category, work_mode, posted_at",
    )
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
    .limit(MAX_COMPANY_ROWS);

  if (error) {
    throw new Error(`Could not load hiring companies: ${error.message}`);
  }

  const groups = new Map<string, CompanyJobRow[]>();

  for (const row of (data ?? []) as CompanyJobRow[]) {
    const companyName = row.company_name?.trim();

    if (!companyName) continue;

    const existing = groups.get(companyName);

    if (existing) {
      existing.push(row);
    } else {
      groups.set(companyName, [row]);
    }
  }

  return [...groups.entries()]
    .map(([name, rows], index): HiringCompany => {
      const newRoles = rows.filter((row) => {
        const postedAt = row.posted_at ? new Date(row.posted_at).getTime() : 0;

        return Number.isFinite(postedAt) && postedAt >= weekStart.getTime();
      }).length;

      const industry = mostCommon(rows.map((row) => row.category)) ?? "Hiring";
      const size = mostCommon(rows.map((row) => row.company_size)) ?? "Growing";
      const workModes = rows
        .map((row) => row.work_mode?.trim())
        .filter(Boolean) as string[];

      return {
        name,
        industry,
        roles: rows.length,
        newRoles,
        size,
        tag: companyTag({ newRoles, workModes }),
        accent: accents[index % accents.length],
        logoUrl: mostCommon(rows.map((row) => row.company_logo_url)),
        website: mostCommon(rows.map((row) => row.company_website)),
      };
    })
    .sort(
      (a, b) =>
        b.newRoles - a.newRoles ||
        b.roles - a.roles ||
        a.name.localeCompare(b.name),
    )
    .slice(0, limit);
}
