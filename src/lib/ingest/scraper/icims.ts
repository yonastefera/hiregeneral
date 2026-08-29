import {
  defaultExpiryDate,
  detectWorkMode,
  htmlToText,
  normalizeEmploymentType,
  safeDescription,
} from "../normalize";
import type { ImportedJob } from "../normalize";
import {
  isEngineeringText,
  isInternshipText,
  isUsText,
  normalizedJobTitleKey,
} from "../filters";
import type { JobSource } from "../job-sources";
import { enhanceImportedJobFromDetailPage } from "../job-detail-extractor";
import {
  decodeBasicHtml,
  metadataNumber,
  metadataString,
  metadataStringArray,
} from "./shared";

export type IcimsJobImpression = {
  idRaw?: number | string;
  title?: string;
  description?: string;
  category?: string;
  positionType?: string;
  postedDate?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  company?: string;
  applyUrl?: string;
};

export function extractIcimsImpressions(html: string) {
  const match = html.match(/var\s+jobImpressions\s*=\s*(\[[\s\S]*?\]);/);

  if (!match) return [];

  try {
    const parsed = JSON.parse(match[1]) as unknown;
    return Array.isArray(parsed) ? (parsed as IcimsJobImpression[]) : [];
  } catch {
    return [];
  }
}

export function extractIcimsJobLinks(html: string) {
  const links = new Map<string, string>();

  for (const match of html.matchAll(
    /<a\b[^>]*href=["']([^"']*\/jobs\/(\d+)\/[^"']*\/job[^"']*)["'][^>]*>/gi,
  )) {
    links.set(match[2], decodeBasicHtml(match[1]));
  }

  return links;
}

export function normalizeIcimsLocationText(value: string) {
  const text = htmlToText(decodeBasicHtml(value)).replace(/\s+/g, " ").trim();

  if (!text) return "";

  const usCityState = text.match(/\bUS-([A-Z]{2})-([^|,\n]+?)(?:\s+-|$)/i);

  if (usCityState) {
    const state = usCityState[1].toUpperCase();
    const city = usCityState[2]
      .replace(/\s*-\s*.*/, "")
      .replace(/\s+/g, " ")
      .trim();

    return city ? `${city}, ${state}, US` : `${state}, US`;
  }

  const stateCity = text.match(/\b([A-Z]{2}),\s*([^|\n-]+?)(?:\s+-|$)/);

  if (stateCity) {
    const state = stateCity[1].toUpperCase();
    const city = stateCity[2].replace(/\s+/g, " ").trim();

    return city ? `${city}, ${state}, US` : `${state}, US`;
  }

  if (/\bUnited States\b/i.test(text)) return "United States";
  if (/\bUS-[A-Z]{2}\b/i.test(text)) return "United States";

  return text;
}

export function extractIcimsCardJobs(
  html: string,
  publicBase: string,
  category: string,
) {
  const jobs: IcimsJobImpression[] = [];

  for (const match of html.matchAll(
    /<li\b[^>]*class=["'][^"']*iCIMS_JobCardItem[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi,
  )) {
    const blockHtml = match[1];
    const titleLink = blockHtml.match(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<h3\b[^>]*>([\s\S]*?)<\/h3>/i,
    );

    if (!titleLink) continue;

    const applyUrl = new URL(
      decodeBasicHtml(titleLink[1]),
      publicBase,
    ).toString();
    const id = applyUrl.match(/\/jobs\/(\d+)\//)?.[1];
    const title = htmlToText(decodeBasicHtml(titleLink[2])).trim();

    if (!title) continue;

    const descriptionMatch = blockHtml.match(
      /<div\b[^>]*class=["'][^"']*description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );
    const description = descriptionMatch
      ? htmlToText(decodeBasicHtml(descriptionMatch[1])).trim()
      : "";

    const blockText = htmlToText(decodeBasicHtml(blockHtml));
    const location = normalizeIcimsLocationText(blockText);

    jobs.push({
      idRaw: id ?? normalizedJobTitleKey(title),
      title,
      description,
      category,
      location: {
        city: location,
        country: "USA",
      },
      applyUrl,
    });
  }

  return jobs;
}

export function icimsLocation(job: IcimsJobImpression) {
  const city = job.location?.city?.trim();
  const state = job.location?.state?.trim();
  const country = job.location?.country?.trim();
  const location = [city, state].filter(Boolean).join(", ");

  if (location) return location;
  if (job.company?.trim()) return job.company.trim();
  if (country === "USA") return "United States";

  return "";
}

export function icimsPostedAt(value: string | undefined) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export async function fetchIcimsJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const publicBase =
    metadataString(source, "publicBase") ??
    `https://${source.companyDomain ?? ""}`;
  const sourceUrl =
    source.sourceUrl ??
    metadataString(source, "searchUrl") ??
    new URL("/jobs/search", publicBase).toString();
  const pageUrl = new URL(sourceUrl);
  pageUrl.searchParams.set("in_iframe", "1");

  const response = await fetch(pageUrl, {
    headers: {
      Accept: "text/html",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
    signal: context?.signal,
  });

  if (!response.ok) {
    throw new Error(
      `iCIMS fetch failed for ${source.companyName}: ${response.status}`,
    );
  }

  const html = await response.text();
  const linkById = extractIcimsJobLinks(html);
  const category = metadataString(source, "category") ?? "Technology";
  const requiredTerms = metadataStringArray(source, "requiredTerms") ?? [];
  const impressionJobs = extractIcimsImpressions(html);
  const sourceJobs =
    impressionJobs.length > 0
      ? impressionJobs
      : extractIcimsCardJobs(html, publicBase, category);
  const jobs = sourceJobs
    .filter((job) => {
      const locationText = [
        icimsLocation(job),
        job.location?.country,
        job.company,
      ].join(" ");
      const searchText = [
        job.title,
        job.category,
        job.description,
        icimsLocation(job),
      ]
        .filter(Boolean)
        .join(" ");

      return (
        isUsText(locationText) &&
        isEngineeringText(searchText) &&
        !isInternshipText(searchText) &&
        requiredTerms.every((term) =>
          searchText.toLowerCase().includes(term.toLowerCase()),
        )
      );
    })
    .slice(0, metadataNumber(source, "maxJobs") ?? 50);

  const imported: ImportedJob[] = [];

  for (const job of jobs) {
    const title = htmlToText(job.title).trim();
    const id = String(job.idRaw ?? normalizedJobTitleKey(title));
    const href = job.applyUrl ?? linkById.get(id);
    const applyUrl = href
      ? new URL(href, publicBase).toString()
      : new URL(`/jobs/${id}/job`, publicBase).toString();
    const location = icimsLocation(job) || "United States";
    const description = safeDescription({
      description: [job.description, title, job.category]
        .filter(Boolean)
        .join(" "),
      title,
      companyName: source.companyName,
    });

    const baseJob: ImportedJob = {
      recruiterId,
      companyId: null,
      companyName: source.companyName,
      companyLogoUrl: source.companyLogoUrl ?? null,
      title,
      description,
      location,

      latitude: null,
      longitude: null,

      employmentType: normalizeEmploymentType(job.positionType),
      workMode: detectWorkMode(title, location),

      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",

      skills: [],
      responsibilities: [],
      requirements: [],
      benefits: [],

      status: "published",

      postedAt: icimsPostedAt(job.postedDate),
      expiresAt: defaultExpiryDate(30),

      sourceName: "scraper",
      sourceId: `${source.sourceSlug}:${id}`,
      applyUrl,

      experienceLevel: null,
      category,

      companyTagline: null,
      companySize: null,
      companyWebsite: source.companyDomain
        ? `https://${source.companyDomain}`
        : null,
    };

    imported.push(
      await enhanceImportedJobFromDetailPage({
        job: baseJob,
        detailUrl: applyUrl,
        signal: context?.signal,
      }),
    );
  }

  return imported;
}
