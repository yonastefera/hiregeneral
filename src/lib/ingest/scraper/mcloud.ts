import {
  defaultExpiryDate,
  detectWorkMode,
  normalizeEmploymentType,
  safeDescription,
} from "../normalize";
import type { ImportedJob } from "../normalize";
import { isEngineeringText, isInternshipText, isUsText } from "../filters";
import type { JobSource } from "../job-sources";
import {
  includesAnyTerm,
  metadataNumber,
  metadataString,
  metadataStringArray,
  splitListItems,
} from "./shared";

export type MCloudJob = {
  id?: number | string;
  ref?: string;
  clientid?: string;
  title?: string;
  description?: string;
  primary_city?: string;
  primary_state?: string;
  primary_country?: string;
  primary_address?: string;
  addtnl_locations?: unknown[];
  job_type?: string;
  employment_type?: string;
  schedule?: string;
  location_type?: string;
  primary_category?: string;
  parent_category?: string;
  function?: string;
  recruiter?: string;
  level?: string;
  salary?: string;
  open_date?: string;
  update_date?: string;
  url?: string;
  seo_url?: string;
  hidden?: string | boolean;
  is_posted?: string | boolean;
};

export type MCloudResponse = {
  totalHits?: number;
  queryResult?: MCloudJob[];
};

export const MCLOUD_DEFAULT_API_BASE =
  "https://jobsapi-internal.m-cloud.io/api";

export const MCLOUD_DEFAULT_PAGE_SIZE = 50;

export const MCLOUD_DEFAULT_MAX_PAGES = 4;

export function firstRecordString(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return "";

  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

export function mcloudJobsUrl(
  source: JobSource,
  pageSize: number,
  offset: number,
) {
  const apiBase = metadataString(source, "apiBase") ?? MCLOUD_DEFAULT_API_BASE;
  const url = new URL("job", `${apiBase.replace(/\/$/, "")}/`);
  const organization =
    metadataString(source, "organization") ??
    metadataString(source, "smartPostOrg") ??
    metadataString(source, "orgId");
  const facets = metadataStringArray(source, "facets") ?? [];

  if (!organization) {
    throw new Error(
      `M-Cloud source ${source.companyName} is missing organization metadata`,
    );
  }

  url.searchParams.set("Organization", organization);
  url.searchParams.set("Limit", String(pageSize));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sortfield", "open_date");
  url.searchParams.set("sortorder", "descending");
  url.searchParams.set("useBooleanKeywordSearch", "true");

  for (const facet of facets) {
    url.searchParams.append("facet", facet);
  }

  return url;
}

export function mcloudLocation(job: MCloudJob) {
  if (
    String(job.location_type ?? "")
      .toLowerCase()
      .includes("remote")
  ) {
    if (job.primary_city && job.primary_state) {
      return `Remote - ${job.primary_city}, ${job.primary_state}`;
    }

    return "Remote - United States";
  }

  const primary = [job.primary_city, job.primary_state]
    .filter(Boolean)
    .join(", ");

  if (primary) return primary;
  if (job.primary_country === "US") return "United States";

  return [job.primary_address, job.primary_country].filter(Boolean).join(", ");
}

export function mcloudLocationSearchText(job: MCloudJob) {
  const addtnlLocations = Array.isArray(job.addtnl_locations)
    ? job.addtnl_locations
        .map((location) =>
          [
            firstRecordString(location, ["city", "primary_city", "name"]),
            firstRecordString(location, ["state", "primary_state"]),
            firstRecordString(location, ["country", "primary_country"]),
          ]
            .filter(Boolean)
            .join(", "),
        )
        .join(" ")
    : "";

  return [
    job.primary_city,
    job.primary_state,
    job.primary_country,
    job.primary_address,
    job.location_type,
    addtnlLocations,
  ]
    .filter(Boolean)
    .join(" ");
}

export function mcloudPostedAt(job: MCloudJob) {
  const parsed = new Date(job.open_date ?? job.update_date ?? "");

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export function mcloudSalary(value: string | null | undefined) {
  const matches = [...(value ?? "").matchAll(/\$?([\d,]+)(?:\.\d{2})?/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  if (matches.length === 0) return { min: null, max: null };

  const [min, max] = [Math.min(...matches), Math.max(...matches)];
  return { min, max: max === min ? null : max };
}

export function mcloudSourceId(source: JobSource, job: MCloudJob) {
  return `${source.sourceSlug}:${job.ref ?? job.clientid ?? job.id ?? job.url}`;
}

export function mcloudApplyUrl(job: MCloudJob, fallback: string) {
  return job.url ?? job.seo_url ?? fallback;
}

export async function fetchMCloudJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const pageSize = Math.max(
    metadataNumber(source, "pageSize") ?? MCLOUD_DEFAULT_PAGE_SIZE,
    1,
  );
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? MCLOUD_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const requiredTerms = metadataStringArray(source, "requiredTerms") ?? [];
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 0; page < maxPages; page += 1) {
    const offset = page * pageSize + 1;
    const response = await fetch(mcloudJobsUrl(source, pageSize, offset), {
      headers: {
        Accept: "application/json",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`M-Cloud fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as MCloudResponse;
    const pageJobs = Array.isArray(data.queryResult) ? data.queryResult : [];

    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      if (job.hidden === true || job.hidden === "true") continue;
      if (job.is_posted === false || job.is_posted === "false") continue;

      const title = job.title?.trim();
      const applyUrl = mcloudApplyUrl(
        job,
        source.sourceUrl ?? companyWebsite ?? "https://careers.homedepot.com",
      );
      if (!title || !applyUrl) continue;

      const sourceId = mcloudSourceId(source, job);
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const description = safeDescription({
        description: job.description,
        title,
        companyName: source.companyName,
      });
      const location = mcloudLocation(job);
      const searchText = [
        title,
        description,
        job.primary_category,
        job.parent_category,
        job.function,
        job.recruiter,
        category,
      ]
        .filter(Boolean)
        .join(" ");
      const sourceSearchText = [
        title,
        job.primary_category,
        job.parent_category,
        job.function,
      ]
        .filter(Boolean)
        .join(" ");

      if (!isUsText(mcloudLocationSearchText(job))) continue;
      if (
        requiredTerms.length > 0 &&
        !includesAnyTerm(sourceSearchText, requiredTerms)
      )
        continue;
      if (!isEngineeringText(searchText)) continue;
      if (isInternshipText(searchText)) continue;

      const salary = mcloudSalary(`${job.level ?? ""} ${job.salary ?? ""}`);

      jobs.push({
        recruiterId,
        companyId: null,
        companyName: source.companyName,
        companyLogoUrl: source.companyLogoUrl ?? null,

        title,
        description,
        location,

        latitude: null,
        longitude: null,

        employmentType: normalizeEmploymentType(
          job.employment_type || job.job_type || job.schedule,
        ),
        workMode: detectWorkMode(
          title,
          `${location} ${job.location_type ?? ""}`,
        ),

        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: splitListItems(job.description, 12),
        requirements: splitListItems(job.description, 14),
        benefits: [],

        status: "published",

        postedAt: mcloudPostedAt(job),
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId,
        applyUrl,

        experienceLevel: null,
        category: job.primary_category ?? category,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }

    if (pageJobs.length < pageSize || jobs.length >= (data.totalHits ?? 0)) {
      break;
    }
  }

  return jobs;
}
