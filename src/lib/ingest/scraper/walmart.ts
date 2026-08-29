import {
  defaultExpiryDate,
  detectWorkMode,
  htmlToText,
  normalizeEmploymentType,
  safeDescription,
} from "../normalize";
import type { ImportedJob } from "../normalize";
import { isEngineeringText, isInternshipText } from "../filters";
import type { JobSource } from "../job-sources";
import {
  metadataNumber,
  metadataString,
  metadataStringArray,
  recordNumber,
  recordString,
  splitListItems,
  uniqueItems,
} from "./shared";

export type WalmartJob = {
  id?: string;
  text?: string;
  metadata?: Record<string, unknown>;
};

export type WalmartSearchResponse = {
  jobs?: WalmartJob[];
  totalJobs?: number;
};

export const WALMART_DEFAULT_API_URL =
  "https://careers.walmart.com/api/ai/search-ai/api/v1/combined/hybrid-search";

export const WALMART_DEFAULT_PAGE_SIZE = 25;

export const WALMART_DEFAULT_MAX_PAGES = 4;

export function walmartTextField(
  text: string | null | undefined,
  label: string,
) {
  if (!text) return "";

  const pattern = new RegExp(
    `${label}:\\s*([\\s\\S]*?)(?:\\n[A-Z][^\\n]{1,60}:|$)`,
  );
  return text.match(pattern)?.[1]?.trim() ?? "";
}

export function walmartMetadataArray(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];
  if (!Array.isArray(value)) return [];

  return uniqueItems(
    value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean),
  );
}

export function walmartLocation(metadata: Record<string, unknown> | undefined) {
  const payRange = metadata?.payRange;
  if (Array.isArray(payRange)) {
    const locations = payRange
      .map((item) => recordString(item, ["location"]))
      .filter(Boolean);
    if (locations.length) return uniqueItems(locations).slice(0, 3).join(", ");
  }

  const city = recordString(metadata, ["primaryLocationCity"]);
  const state = recordString(metadata, ["primaryLocationState"]);
  const country = recordString(metadata, ["primaryLocationCountry"]);

  return (
    uniqueItems([city, state, country].filter(Boolean)).join(", ") ||
    "United States"
  );
}

export function walmartPostedAt(metadata: Record<string, unknown> | undefined) {
  const timestamp = recordNumber(metadata, ["jobPostingStartDate"]);
  if (timestamp) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  return new Date().toISOString();
}

export function walmartDescription(job: WalmartJob, title: string) {
  const text = htmlToText(job.text);
  const summary = walmartTextField(text, "Job Summary");
  const description = walmartTextField(text, "Job Posting Description");

  return safeDescription({
    title,
    companyName: "Walmart",
    description: [summary, description || text].filter(Boolean).join("\n\n"),
  });
}

export function walmartApplyUrl(source: JobSource, job: WalmartJob) {
  const publicBase =
    metadataString(source, "publicBase") ?? "https://careers.walmart.com";
  const id = job.metadata ? recordString(job.metadata, ["jobId"]) : job.id;
  const externalId = job.id ?? id;

  if (!externalId) return source.sourceUrl || publicBase;

  return new URL(
    `/us/en/jobs/${encodeURIComponent(externalId)}`,
    publicBase,
  ).toString();
}

export async function fetchWalmartJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const apiUrl = metadataString(source, "apiUrl") ?? WALMART_DEFAULT_API_URL;
  const pageSize = Math.min(
    Math.max(
      metadataNumber(source, "pageSize") ?? WALMART_DEFAULT_PAGE_SIZE,
      1,
    ),
    50,
  );
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? WALMART_DEFAULT_MAX_PAGES,
    1,
  );
  const locale = metadataString(source, "locale") ?? "en_US";
  const lang = metadataString(source, "lang") ?? "en";
  const searchTerms = metadataStringArray(source, "searchTerms") ?? [
    "software",
    "engineer",
    "developer",
    "technology",
  ];
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const searchTerm of searchTerms) {
    for (let page = 0; page < maxPages; page += 1) {
      const url = new URL(apiUrl);
      url.searchParams.set("page", String(page));
      url.searchParams.set("size", String(pageSize));
      url.searchParams.set("locale", locale);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "HireGeneralJobBoard/1.0",
        },
        body: JSON.stringify({
          query: searchTerm,
          directSearch: true,
          isReset: page === 0,
          lang,
        }),
        cache: "no-store",
        signal: context?.signal,
      });

      if (!response.ok) {
        throw new Error(`Walmart careers fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as WalmartSearchResponse;
      const pageJobs = Array.isArray(data.jobs) ? data.jobs : [];

      if (pageJobs.length === 0) break;

      for (const job of pageJobs) {
        const metadata = job.metadata;
        const title =
          recordString(metadata, ["title", "jobPostingTitle"]) ||
          walmartTextField(job.text, "Job Posting Title");
        if (!title) continue;

        const sourceId = `${source.sourceSlug}:${
          recordString(metadata, ["jobId"]) || job.id || title
        }`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const location = walmartLocation(metadata);
        const description = walmartDescription(job, title);
        const skills = walmartMetadataArray(metadata, "skills").slice(0, 16);
        const searchText = [
          title,
          description,
          walmartMetadataArray(metadata, "areas").join(" "),
          walmartMetadataArray(metadata, "categories").join(" "),
          walmartMetadataArray(metadata, "jobFamilyId").join(" "),
          skills.join(" "),
        ]
          .filter(Boolean)
          .join(" ");

        if (recordString(metadata, ["primaryLocationCountry"]) !== "US")
          continue;
        if (recordString(metadata, ["brand"]).toLowerCase() !== "walmart")
          continue;
        if (!isEngineeringText(searchText)) continue;
        if (isInternshipText(searchText)) continue;

        const importedJob: ImportedJob = {
          recruiterId,
          companyId: null,
          companyName: source.companyName,
          companyLogoUrl: source.companyLogoUrl ?? null,

          title,
          description,
          location,

          latitude: recordNumber(metadata, ["latitudeDgr"]),
          longitude: recordNumber(metadata, ["longitudeDgr"]),

          employmentType: normalizeEmploymentType(
            recordString(metadata, ["timeType"]),
          ),
          workMode: detectWorkMode(title, location),

          salaryMin: recordNumber(metadata, ["minPay"]),
          salaryMax: recordNumber(metadata, ["maxPay"]),
          salaryCurrency: recordString(metadata, ["currencyCode"]) || "USD",

          skills,
          responsibilities: splitListItems(description, 12),
          requirements: splitListItems(description, 14),
          benefits: [],

          status: "published",

          postedAt: walmartPostedAt(metadata),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId,
          applyUrl: walmartApplyUrl(source, job),

          experienceLevel: null,
          category,

          companyTagline: null,
          companySize: null,
          companyWebsite,
        };

        jobs.push(importedJob);
      }

      if (pageJobs.length < pageSize) break;
    }
  }

  return jobs;
}
