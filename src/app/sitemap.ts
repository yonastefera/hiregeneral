import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

import { getCanonicalJobUrl, getSiteUrl } from "@/lib/seo/site";
import { createSupabasePublicClient } from "@/lib/supabase/public";

const MAX_SITEMAP_URLS = 50_000;

export const revalidate = 86400;

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

type SitemapJob = {
  id: string;
  slug: string | null;
  updated_at: string;
};

function isSitemapJob(value: unknown): value is SitemapJob {
  if (!value || typeof value !== "object") return false;

  const job = value as Partial<SitemapJob>;
  return (
    typeof job.id === "string" &&
    (typeof job.slug === "string" || job.slug === null) &&
    typeof job.updated_at === "string"
  );
}

const loadSitemapJobs = unstable_cache(
  async () => {
    const supabase = createSupabasePublicClient();
    const jobLimit = MAX_SITEMAP_URLS - PUBLIC_ROUTES.length;
    const { data, error } = await supabase.rpc("get_public_job_sitemap", {
      p_limit: jobLimit,
    });

    if (error) throw new Error(error.message);

    return Array.isArray(data) ? data.filter(isSitemapJob) : [];
  },
  ["public-job-sitemap-v1"],
  {
    revalidate: 86400,
    tags: ["public-job-sitemap"],
  },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  let jobs: SitemapJob[] = [];

  try {
    jobs = await loadSitemapJobs();
  } catch {
    console.error("[sitemap:jobs] Failed to load published jobs.");
  }

  return [
    ...PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
      url: new URL(path || "/", siteUrl).toString(),
      changeFrequency,
      priority,
    })),
    ...jobs.map((job) => ({
      url: getCanonicalJobUrl(job),
      lastModified: job.updated_at,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
