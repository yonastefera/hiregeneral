import {
  defaultExpiryDate,
  detectWorkMode,
  htmlToText,
  normalizeEmploymentType,
  safeDescription,
} from "../normalize";
import type { ImportedJob } from "../normalize";
import { isEngineeringText, isInternshipText, isUsText } from "../filters";
import type { JobSource } from "../job-sources";
import {
  isoDateFromText,
  metadataNumber,
  metadataString,
  splitListItems,
} from "./shared";

export type JibeJobData = {
  category?: string | string[];
  city?: string;
  country?: string;
  country_code?: string;
  description?: string;
  employment_type?: string;
  location?: string;
  posted_date?: string;
  postedDate?: string;
  req_id?: string;
  remote_eligible?: boolean | string;
  slug?: string;
  state?: string;
  tags2?: string | Array<{ name?: string }>;
  title?: string;
  updated?: string;
  updated_at?: string;
};

export type JibeJob = {
  data?: JibeJobData;
};

export type JibeSearchResponse = {
  count?: number;
  jobs?: JibeJob[];
  totalCount?: number;
};

export const JIBE_DEFAULT_MAX_PAGES = 8;

export function jibeSearchQueries(source: JobSource) {
  const value = source.metadata.searchQueries;

  if (Array.isArray(value)) {
    const queries = value
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
      .filter((item) => Object.keys(item).length > 0);

    if (queries.length > 0) return queries;
  }

  return [
    source.metadata.query && typeof source.metadata.query === "object"
      ? (source.metadata.query as Record<string, unknown>)
      : {},
  ];
}

export function jibeJobsUrl(
  source: JobSource,
  page: number,
  query: Record<string, unknown>,
) {
  const apiUrl =
    metadataString(source, "apiUrl") ??
    new URL(
      "/api/jobs",
      source.sourceUrl ?? "https://careers.ice.com",
    ).toString();
  const url = new URL(apiUrl);

  for (const [key, value] of Object.entries(query)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      url.searchParams.set(key, String(value));
    }
  }

  url.searchParams.set("page", String(page));
  return url;
}

export function jibeTags(value: JibeJobData["tags2"]) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => tag.name ?? "")
      .filter(Boolean)
      .join(" ");
  }

  return value ?? "";
}

export function jibeCategory(value: JibeJobData["category"], fallback: string) {
  if (Array.isArray(value)) {
    return value.find((item) => item.trim())?.trim() ?? fallback;
  }

  return value?.trim() || fallback;
}

export function jibeLocation(job: JibeJobData) {
  if (job.location?.trim()) return job.location.trim();

  return (
    [job.city, job.state, job.country].filter(Boolean).join(", ") ||
    "United States"
  );
}

export function jibeIsUsJob(job: JibeJobData, location: string) {
  const countryCode = job.country_code?.trim().toUpperCase();
  const country = job.country?.trim().toLowerCase();

  if (countryCode && countryCode !== "US") return false;
  if (country && country !== "united states" && country !== "usa") {
    return false;
  }

  return isUsText(`${location} ${job.state ?? ""} ${country ?? ""}`);
}

export function jibePostedAt(job: JibeJobData) {
  return (
    isoDateFromText(job.posted_date) ??
    isoDateFromText(job.postedDate) ??
    isoDateFromText(job.updated_at) ??
    isoDateFromText(job.updated) ??
    new Date().toISOString()
  );
}

export function jibeApplyUrl(source: JobSource, job: JibeJobData) {
  const publicBase =
    metadataString(source, "publicBase") ??
    source.sourceUrl ??
    "https://careers.ice.com";

  if (job.slug) {
    return new URL(`/jobs/${job.slug}`, publicBase).toString();
  }

  return source.sourceUrl ?? publicBase;
}

export async function fetchJibeJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? JIBE_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();
  const searchQueries = jibeSearchQueries(source);

  for (const searchQuery of searchQueries) {
    for (let page = 1; page <= maxPages; page += 1) {
      const response = await fetch(jibeJobsUrl(source, page, searchQuery), {
        headers: {
          Accept: "application/json",
          "User-Agent": "HireGeneralJobBoard/1.0",
        },
        cache: "no-store",
        signal: context?.signal,
      });

      if (!response.ok) {
        throw new Error(`Jibe careers fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as JibeSearchResponse;
      const pageJobs = Array.isArray(data.jobs) ? data.jobs : [];
      if (pageJobs.length === 0) break;

      for (const item of pageJobs) {
        const job = item.data;
        if (!job?.title?.trim()) continue;

        const sourceId = `${source.sourceSlug}:${
          job.req_id ?? job.slug ?? job.title
        }`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const title = job.title.trim();
        const location = jibeLocation(job);
        const jobCategory = jibeCategory(job.category, category);
        const description = safeDescription({
          description: htmlToText(job.description),
          title,
          companyName: source.companyName,
        });
        const searchText = [
          title,
          description,
          jobCategory,
          jibeTags(job.tags2),
          category,
        ]
          .filter(Boolean)
          .join(" ");

        if (!jibeIsUsJob(job, location)) continue;
        if (!isEngineeringText(searchText)) continue;
        if (isInternshipText(searchText)) continue;

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

          employmentType: normalizeEmploymentType(job.employment_type),
          workMode: detectWorkMode(
            title,
            `${location} ${String(job.remote_eligible ?? "")}`,
          ),

          salaryMin: null,
          salaryMax: null,
          salaryCurrency: "USD",

          skills: [],
          responsibilities: splitListItems(description, 12),
          requirements: splitListItems(description, 14),
          benefits: [],

          status: "published",

          postedAt: jibePostedAt(job),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId,
          applyUrl: jibeApplyUrl(source, job),

          experienceLevel: null,
          category: jobCategory,

          companyTagline: null,
          companySize: null,
          companyWebsite,
        });
      }

      if (
        pageJobs.length < (data.count ?? pageJobs.length) ||
        (data.totalCount && jobs.length >= data.totalCount)
      ) {
        break;
      }
    }
  }

  return jobs;
}
