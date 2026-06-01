import { headers } from "next/headers";

import JobsPageClient from "./JobsPageClient";
import { JobsResultsList } from "./JobsResultsList";
import {
  buildJobsApiParams,
  normalizeJobsPageData,
  parseJobsSearchParams,
  type JobsApiResponse,
  type JobsPageData,
  type JobsSearchState,
} from "./search-options";
import type { Job } from "@/lib/db/types";

type JobsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Builds the absolute base URL needed for server-side fetches.
 * Server Components cannot reliably call relative URLs like "/api/jobs".
 */
async function getBaseUrl() {
  const headerStore = await headers();

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Fetches the first page of jobs on the server so the /jobs route
 * does not render as an empty client-only shell.
 */
async function getInitialJobsData(
  state: JobsSearchState,
): Promise<JobsPageData> {
  try {
    const baseUrl = await getBaseUrl();
    const params = buildJobsApiParams(state);

    const response = await fetch(`${baseUrl}/api/jobs?${params.toString()}`, {
      next: {
        // Keyword search is more intent-specific, so cache it briefly.
        // Browse/location pages can be cached slightly longer.
        revalidate: state.query.trim() ? 60 : 180,
      },
    });

    const body = (await response.json().catch(() => null)) as
      | JobsApiResponse
      | Job[]
      | null;

    if (!response.ok) {
      return {
        jobs: [],
        totalJobs: 0,
        newJobs: 0,
        totalPages: 1,
      };
    }

    return normalizeJobsPageData(body);
  } catch {
    return {
      jobs: [],
      totalJobs: 0,
      newJobs: 0,
      totalPages: 1,
    };
  }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialState = parseJobsSearchParams(resolvedSearchParams);
  const initialData = await getInitialJobsData(initialState);

  return (
    <JobsPageClient initialState={initialState}>
      <JobsResultsList state={initialState} data={initialData} />
    </JobsPageClient>
  );
}
