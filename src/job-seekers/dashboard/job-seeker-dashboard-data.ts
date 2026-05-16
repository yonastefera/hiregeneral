import { headers } from "next/headers";

import type { Job } from "@/lib/db/types";
import { normalizeUsStateRegion } from "@/lib/location/us-states";

const FEATURED_JOBS_PAGE = "1";
const FEATURED_JOBS_PAGE_SIZE = "3";
const FEATURED_JOBS_LOOKBACK_DAYS = "3650";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export interface JobSeekerDashboardStats {
  totalJobs: number;
  totalUsers: number;
  totalApplications: number;
  totalCompanies: number;
}

export type JobSeekerDashboardJob = Job & {
  applicant_count?: number;
};

function getDefaultStats(): JobSeekerDashboardStats {
  return {
    totalJobs: 0,
    totalUsers: 0,
    totalApplications: 0,
    totalCompanies: 0,
  };
}

function isStats(value: unknown): value is JobSeekerDashboardStats {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<
    Record<keyof JobSeekerDashboardStats, unknown>
  >;

  return (
    typeof candidate.totalJobs === "number" &&
    typeof candidate.totalUsers === "number" &&
    typeof candidate.totalApplications === "number" &&
    typeof candidate.totalCompanies === "number"
  );
}

function decodeHeaderValue(value: string | null): string | null {
  if (!value) return null;

  try {
    return decodeURIComponent(value).replace(/\+/g, " ").trim();
  } catch {
    return value.replace(/\+/g, " ").trim();
  }
}

async function getApproximateLocationFromVercelHeaders(): Promise<string> {
  const headersList = await headers();

  const country = headersList.get("x-vercel-ip-country");
  const rawCity = headersList.get("x-vercel-ip-city");
  const rawRegion = headersList.get("x-vercel-ip-country-region");

  // Only prefill city/state for US visitors.
  // Non-US regions may not match your current location-search format.
  if (country && country !== "US") {
    return "";
  }

  const city = decodeHeaderValue(rawCity);
  const region = normalizeUsStateRegion(decodeHeaderValue(rawRegion));

  if (!city || !region) {
    return "";
  }

  return `${city}, ${region}`;
}

async function getDashboardStats(): Promise<{
  data: JobSeekerDashboardStats;
  error: string | null;
}> {
  try {
    const response = await fetch(`${SITE_URL}/api/stats`, {
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Could not load stats. Server returned ${response.status}.`,
      );
    }

    const data: unknown = await response.json();

    if (!isStats(data)) {
      throw new Error(
        "Could not load stats. The server returned an invalid response.",
      );
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: getDefaultStats(),
      error:
        error instanceof Error
          ? error.message
          : "Could not load dashboard stats.",
    };
  }
}

async function getFeaturedJobs(): Promise<{
  data: JobSeekerDashboardJob[];
  error: string | null;
}> {
  try {
    const seed = `dashboard:${new Date().toISOString().slice(0, 13)}`;
    const params = new URLSearchParams({
      page: FEATURED_JOBS_PAGE,
      pageSize: FEATURED_JOBS_PAGE_SIZE,
      daysAgo: FEATURED_JOBS_LOOKBACK_DAYS,
      seed,
    });

    const response = await fetch(`${SITE_URL}/api/jobs?${params.toString()}`, {
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: unknown;
      } | null;

      throw new Error(
        typeof body?.error === "string"
          ? body.error
          : `Could not load featured jobs. Server returned ${response.status}.`,
      );
    }

    const body = (await response.json()) as { data?: unknown };

    const nextJobs: JobSeekerDashboardJob[] = Array.isArray(body.data)
      ? (body.data as JobSeekerDashboardJob[])
      : [];

    return {
      data: nextJobs.slice(0, Number(FEATURED_JOBS_PAGE_SIZE)),
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Could not load featured jobs.",
    };
  }
}

export async function getJobSeekerDashboardData(): Promise<{
  stats: JobSeekerDashboardStats;
  jobs: JobSeekerDashboardJob[];
  statsError: string | null;
  jobsError: string | null;
  initialLocation: string;
}> {
  const [statsResult, jobsResult, initialLocation] = await Promise.all([
    getDashboardStats(),
    getFeaturedJobs(),
    getApproximateLocationFromVercelHeaders(),
  ]);

  return {
    stats: statsResult.data,
    jobs: jobsResult.data,
    statsError: statsResult.error,
    jobsError: jobsResult.error,
    initialLocation,
  };
}
