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
import { enhanceImportedJobFromDetailPage } from "../job-detail-extractor";

export type FedExPreloadJob = {
  applyURL?: string;
  brandName?: string;
  companyName?: string;
  customFields?: Array<{
    cfKey?: string;
    value?: string;
  }>;
  employmentType?: string[];
  isRemote?: boolean;
  locations?: Array<{
    city?: string;
    country?: string;
    countryAbbr?: string;
    locationParsedText?: string;
    locationText?: string;
    state?: string;
    stateAbbr?: string;
  }>;
  reference?: string;
  requisitionID?: string;
  title?: string;
  uniqueID?: string;
};

export function metadataString(source: JobSource, key: string) {
  const value = source.metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function metadataNumber(source: JobSource, key: string) {
  const value = source.metadata[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function metadataStringArray(source: JobSource, key: string) {
  const value = source.metadata[key];

  if (!Array.isArray(value)) return null;

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function uniqueItems(items: string[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

export function normalizeLine(value: string) {
  return value
    .replace(/^[•·\-\u2013\u2014\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeBasicHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function splitListItems(
  value: string | null | undefined,
  maxItems: number,
) {
  return uniqueItems(
    htmlToText(value)
      .split(/\n+/)
      .map(normalizeLine)
      .filter((line) => line.length >= 10),
  ).slice(0, maxItems);
}

export function recordString(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return "";

  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

export function recordNumber(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return null;

  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

export function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function htmlAttribute(value: string, attribute: string) {
  const match = value.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"));

  return match?.[1] ? decodeHtml(match[1]).trim() : "";
}

export function numberRangeFromText(value: string) {
  const amounts = [...value.matchAll(/\$?\s*([\d,]+)(?:\.\d{2})?/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  if (amounts.length === 0) return { min: null, max: null };

  const min = Math.min(...amounts);
  const max = Math.max(...amounts);

  return { min, max: max === min ? null : max };
}

export function isoDateFromText(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function includesAnyTerm(value: string, terms: string[]) {
  const lowerValue = value.toLowerCase();

  return terms.some((term) => lowerValue.includes(term.toLowerCase()));
}

export function isNonJobTitle(value: string) {
  return /\b(cookie|disclosure|privacy|terms(?:\s+of\s+use)?|accessibility|equal opportunity)\b/i.test(
    value,
  );
}

export function fedexPreloadState(html: string) {
  const marker = "window.__PRELOAD_STATE__";
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return [];

  const objectStart = html.indexOf("{", markerIndex + marker.length);
  if (objectStart < 0) return [];

  let inString = false;
  let escaped = false;
  let depth = 0;

  for (let index = objectStart; index < html.length; index += 1) {
    const char = html[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char !== "}") continue;

    depth -= 1;
    if (depth !== 0) continue;

    try {
      const data = JSON.parse(html.slice(objectStart, index + 1)) as {
        jobSearch?: {
          jobs?: FedExPreloadJob[];
        };
      };

      return Array.isArray(data.jobSearch?.jobs) ? data.jobSearch.jobs : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function fedexLocation(job: FedExPreloadJob) {
  const locations = job.locations ?? [];
  const usLocations = locations.filter(
    (location) =>
      location.countryAbbr === "US" ||
      /^United States/i.test(location.country ?? ""),
  );
  const selected = usLocations.length > 0 ? usLocations : locations;
  const labels = selected
    .map((location) => {
      const city = location.city?.trim();
      const state = (location.stateAbbr ?? location.state)?.trim();
      const country = location.country?.trim();

      return [city, state, country].filter(Boolean).join(", ");
    })
    .filter(Boolean);

  return uniqueItems(labels).slice(0, 4).join(", ") || "United States";
}

export function preloadCustomField(job: FedExPreloadJob, pattern: RegExp) {
  return (
    job.customFields?.find((field) =>
      pattern.test(`${field.cfKey ?? ""} ${field.value ?? ""}`),
    )?.value ?? ""
  );
}

export function preloadCustomFieldsText(job: FedExPreloadJob) {
  return (job.customFields ?? [])
    .map((field) => field.value)
    .filter(Boolean)
    .join(" ");
}

export function preloadSourceId(
  source: JobSource,
  job: FedExPreloadJob,
  applyUrl: string,
) {
  return `${source.sourceSlug}:${
    job.requisitionID ?? job.reference ?? job.uniqueID ?? applyUrl
  }`;
}

export function preloadSearchText(
  source: JobSource,
  job: FedExPreloadJob,
  category: string,
) {
  return [
    job.title,
    job.brandName,
    job.companyName,
    job.reference,
    job.requisitionID,
    job.uniqueID,
    job.employmentType?.join(" "),
    fedexLocation(job),
    preloadCustomFieldsText(job),
    category,
    source.companyName,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function fetchPreloadedCareerJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const response = await fetch(
    source.sourceUrl ??
      "https://careers.fedex.com/career-areas/professional/jobs",
    {
      headers: {
        Accept: "text/html",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Preloaded careers fetch failed: ${response.status}`);
  }

  const category = metadataString(source, "category") ?? "Technology";
  const requiredTerms = metadataStringArray(source, "requiredTerms") ?? [];
  const titleTerms = metadataStringArray(source, "titleTerms") ?? [];
  const excludedTitleTerms =
    metadataStringArray(source, "excludedTitleTerms") ?? [];
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);

  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();
  const html = await response.text();
  const preloadJobs = fedexPreloadState(html);

  for (const job of preloadJobs) {
    const title = job.title?.trim();
    const applyUrl = job.applyURL?.trim();

    if (!title || !applyUrl) continue;

    const sourceId = preloadSourceId(source, job, applyUrl);

    if (seenSourceIds.has(sourceId)) continue;
    seenSourceIds.add(sourceId);

    const location = fedexLocation(job);
    const employmentTypeText = Array.isArray(job.employmentType)
      ? job.employmentType.join(" ")
      : "";
    const fieldsText = preloadCustomFieldsText(job);
    const remoteText = preloadCustomField(job, /remote/i);
    const salary = numberRangeFromText(
      preloadCustomField(job, /salary|pay|compensation/i),
    );
    const searchText = preloadSearchText(source, job, category);
    const sourceSearchText = [
      title,
      job.brandName,
      job.companyName,
      job.reference,
      job.requisitionID,
      job.uniqueID,
      employmentTypeText,
      location,
      fieldsText,
    ]
      .filter(Boolean)
      .join(" ");

    if (!isUsText(location)) continue;
    if (!isEngineeringText(searchText)) continue;
    if (isInternshipText(searchText)) continue;

    if (
      requiredTerms.length > 0 &&
      !includesAnyTerm(sourceSearchText, requiredTerms)
    ) {
      continue;
    }

    if (titleTerms.length > 0 && !includesAnyTerm(title, titleTerms)) {
      continue;
    }

    if (
      excludedTitleTerms.length > 0 &&
      includesAnyTerm(title, excludedTitleTerms)
    ) {
      continue;
    }

    const fallbackDescription = safeDescription({
      title,
      companyName: source.companyName,
      description: `${title} role at ${source.companyName}. Visit the company careers site for the complete description and application details.`,
    });

    const importedJob: ImportedJob = {
      recruiterId,
      companyId: null,
      companyName: source.companyName,
      companyLogoUrl: source.companyLogoUrl ?? null,

      title,
      description: fallbackDescription,
      location,

      latitude: null,
      longitude: null,

      employmentType: normalizeEmploymentType(employmentTypeText),
      workMode: detectWorkMode(
        `${title} ${remoteText}`,
        `${location} ${String(job.isRemote)}`,
      ),

      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryCurrency: "USD",

      skills: [],
      responsibilities: [],
      requirements: [],
      benefits: [],

      status: "published",

      postedAt: new Date().toISOString(),
      expiresAt: defaultExpiryDate(30),

      sourceName: "scraper",
      sourceId,
      applyUrl,

      experienceLevel: null,
      category,

      companyTagline: null,
      companySize: null,
      companyWebsite,
    };

    const enhancedJob = await enhanceImportedJobFromDetailPage({
      job: importedJob,
      detailUrl: applyUrl,
      signal: context?.signal,
    });

    jobs.push(enhancedJob);
  }

  return jobs;
}
