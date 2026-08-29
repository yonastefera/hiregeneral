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
  metadataNumber,
  metadataString,
  metadataStringArray,
  splitListItems,
  uniqueItems,
} from "./shared";

export type YahooCareerJobFields = {
  ApplyLink?: string;
  Brand?: string;
  JobCategory?: string;
  JobDescription?: string;
  JobLevel?: string;
  JobTitle?: string;
  OtherLocations?: string;
  PostingDate?: string;
  PrimaryLocation?: string;
  ReqNo?: string;
  documentid?: string;
  message?: string;
};

export type YahooCareerSearchResult = {
  fields?: YahooCareerJobFields;
};

export type YahooCareerSearchResponse =
  | YahooCareerSearchResult[]
  | {
      TotalResultCount?: number;
      data?: YahooCareerSearchResult[];
    };

export const YAHOO_DEFAULT_API_URL =
  "https://www.yahooinc.com/careers/calls/makeVespaCalls.php";

export const YAHOO_DEFAULT_PAGE_SIZE = 20;

export const YAHOO_DEFAULT_MAX_PAGES = 5;

export function yahooPageJobs(data: YahooCareerSearchResponse) {
  return (Array.isArray(data) ? data : (data.data ?? [])).filter(
    (item): item is YahooCareerSearchResult =>
      Boolean(item.fields && !item.fields.message),
  );
}

export function yahooLocation(fields: YahooCareerJobFields) {
  const locations = uniqueItems(
    [fields.PrimaryLocation, fields.OtherLocations]
      .filter((item): item is string => Boolean(item?.trim()))
      .flatMap((item) =>
        item.split(
          /,\s*(?=[A-Z][a-z]+ - |US - |United|India|Canada|France|Germany|Ireland|Israel|Norway|Taiwan)/,
        ),
      ),
  );

  return locations.slice(0, 3).join(", ") || "United States";
}

export function yahooPostedAt(value: string | null | undefined) {
  const parsed = new Date(value ?? "");

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export async function fetchYahooJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const apiUrl = metadataString(source, "apiUrl") ?? YAHOO_DEFAULT_API_URL;
  const searchTerms = metadataStringArray(source, "searchTerms") ?? [
    "software",
    "engineer",
    "developer",
    "technology",
  ];
  const jobCategories = metadataStringArray(source, "jobCategories") ?? [
    "Software Development",
    "Engineering",
    "Information Systems",
  ];
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? YAHOO_DEFAULT_MAX_PAGES,
    1,
  );
  const pageSize = Math.max(
    metadataNumber(source, "pageSize") ?? YAHOO_DEFAULT_PAGE_SIZE,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const searchTerm of searchTerms) {
    for (let page = 0; page < maxPages; page += 1) {
      const body = new URLSearchParams({
        searchContent: searchTerm.replace(/\s+/g, "-"),
        action: "searchJobs",
        job_cats: jobCategories.join(","),
        job_brands: "",
        job_locations: "",
        job_levels: "",
        offset: String(page * pageSize),
        check: metadataString(source, "check") ?? "1",
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "HireGeneralJobBoard/1.0",
        },
        body,
        cache: "no-store",
        signal: context?.signal,
      });

      if (!response.ok) {
        throw new Error(`Yahoo careers fetch failed: ${response.status}`);
      }

      const text = await response.text();
      const data = JSON.parse(text) as YahooCareerSearchResponse;
      const pageJobs = yahooPageJobs(data);

      if (pageJobs.length === 0) break;

      for (const item of pageJobs) {
        const fields = item.fields;
        const title = fields?.JobTitle?.replace(/<\/?[^>]+>/g, "").trim();
        const applyUrl = fields?.ApplyLink?.trim();

        if (!fields || !title || !applyUrl) continue;

        const sourceId = `${source.sourceSlug}:${
          fields.ReqNo ?? fields.documentid ?? applyUrl
        }`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const location = yahooLocation(fields);
        const description = safeDescription({
          description: fields.JobDescription,
          title,
          companyName: source.companyName,
        });
        const searchText = [
          title,
          description,
          fields.Brand,
          fields.JobCategory,
          fields.JobLevel,
        ]
          .filter(Boolean)
          .join(" ");

        if (!isUsText(location)) continue;
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

          latitude: null,
          longitude: null,

          employmentType: normalizeEmploymentType("Full-time"),
          workMode: detectWorkMode(title, `${location} ${description}`),

          salaryMin: null,
          salaryMax: null,
          salaryCurrency: "USD",

          skills: [],
          responsibilities: splitListItems(fields.JobDescription, 12),
          requirements: splitListItems(fields.JobDescription, 14),
          benefits: [],

          status: "published",

          postedAt: yahooPostedAt(fields.PostingDate),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId,
          applyUrl,

          experienceLevel: fields.JobLevel ?? null,
          category: fields.JobCategory ?? category,

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
