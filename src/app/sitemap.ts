import type { MetadataRoute } from "next";

import { getCanonicalJobUrl, getSiteUrl } from "@/lib/seo/site";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const MAX_SITEMAP_URLS = 50_000;

export const revalidate = 3600;

const PUBLIC_ROUTES = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/jobs", changeFrequency: "hourly", priority: 0.9 },
  { path: "/employers", changeFrequency: "monthly", priority: 0.7 },
  { path: "/salary-guide", changeFrequency: "monthly", priority: 0.7 },
  { path: "/salaries", changeFrequency: "weekly", priority: 0.7 },
  { path: "/career-insights", changeFrequency: "weekly", priority: 0.6 },
  { path: "/why-us", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date().toISOString();
  const supabase = createSupabasePublicClient();
  const jobLimit = MAX_SITEMAP_URLS - PUBLIC_ROUTES.length;
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, slug, updated_at")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("updated_at", { ascending: false })
    .limit(jobLimit);

  if (error) {
    console.error("[sitemap:jobs] Failed to load published jobs.");
  }

  return [
    ...PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
      url: new URL(path || "/", siteUrl).toString(),
      changeFrequency,
      priority,
    })),
    ...(jobs ?? []).map((job) => ({
      url: getCanonicalJobUrl(job),
      lastModified: job.updated_at,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
