import type { Job } from "@/lib/db/types";

export const DEFAULT_POSTED = "3650";
export const DEFAULT_DISTANCE = "100";
export const PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 300;

export type JobsSearchState = {
  query: string;
  location: string;
  dateFilter: string;
  distance: string;
  page: number;
};

export type JobsApiResponse = {
  data?: Job[];
  total?: number;
  newJobs?: number;
  totalPages?: number;
  error?: string;
};

export type JobsPageData = {
  jobs: Job[];
  totalJobs: number;
  newJobs: number;
  totalPages: number;
};

export const postedOptions = [
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: DEFAULT_POSTED, label: "Any time" },
] as const;

export const distanceOptions = [
  { value: "5", label: "Within 5 miles" },
  { value: "10", label: "Within 10 miles" },
  { value: "25", label: "Within 25 miles" },
  { value: "50", label: "Within 50 miles" },
  { value: DEFAULT_DISTANCE, label: "Within 100 miles" },
] as const;

export function getValidPage(value: string | null | undefined) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function getSearchParamValue(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

export function parseJobsSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): JobsSearchState {
  return {
    query: getSearchParamValue(searchParams.q),
    location: getSearchParamValue(searchParams.location),
    dateFilter: getSearchParamValue(searchParams.posted, DEFAULT_POSTED),
    distance: getSearchParamValue(searchParams.distance, DEFAULT_DISTANCE),
    page: getValidPage(getSearchParamValue(searchParams.page, "1")),
  };
}

export function buildJobsApiParams(state: JobsSearchState) {
  const params = new URLSearchParams({
    page: String(state.page),
    pageSize: String(PAGE_SIZE),
    daysAgo: state.dateFilter,
    distance: state.distance,
  });

  if (state.query.trim()) {
    params.set("query", state.query.trim());
  }

  if (state.location.trim()) {
    params.set("location", state.location.trim());
  }

  return params;
}

export function buildJobsUrlParams(state: JobsSearchState) {
  const params = new URLSearchParams();

  if (state.query.trim()) {
    params.set("q", state.query.trim());
  }

  if (state.location.trim()) {
    params.set("location", state.location.trim());
  }

  if (state.dateFilter !== DEFAULT_POSTED) {
    params.set("posted", state.dateFilter);
  }

  if (state.distance !== DEFAULT_DISTANCE) {
    params.set("distance", state.distance);
  }

  if (state.page > 1) {
    params.set("page", String(state.page));
  }

  return params;
}

export function getJobsFromApiBody(body: unknown): Job[] {
  if (Array.isArray(body)) {
    return body as Job[];
  }

  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    Array.isArray((body as JobsApiResponse).data)
  ) {
    return (body as JobsApiResponse).data ?? [];
  }

  return [];
}

export function normalizeJobsPageData(body: unknown): JobsPageData {
  const jobs = getJobsFromApiBody(body);

  if (!body || Array.isArray(body) || typeof body !== "object") {
    return {
      jobs,
      totalJobs: jobs.length,
      newJobs: 0,
      totalPages: 1,
    };
  }

  const response = body as JobsApiResponse;

  return {
    jobs,
    totalJobs:
      typeof response.total === "number" ? response.total : jobs.length,
    newJobs: typeof response.newJobs === "number" ? response.newJobs : 0,
    totalPages:
      typeof response.totalPages === "number"
        ? Math.max(1, response.totalPages)
        : 1,
  };
}
