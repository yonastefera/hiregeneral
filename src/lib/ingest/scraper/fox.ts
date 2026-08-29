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
import { decodeHtml, metadataNumber, metadataString } from "./shared";

export type FoxSearchJob = {
  applyUrl: string;
  brand: string;
  dateText: string;
  location: string;
  sourceId: string;
  title: string;
};

export const FOX_DEFAULT_API_URL =
  "https://www.foxcareers.com/Search/JobsList/";

export const FOX_DEFAULT_MAX_PAGES = 4;

export function foxJobsListUrl(source: JobSource, page: number) {
  const apiUrl = metadataString(source, "apiUrl") ?? FOX_DEFAULT_API_URL;
  const params = {
    page: String(page),
    jobFunction:
      metadataString(source, "jobFunction") ??
      "Information Technology_Technology",
    brand: metadataString(source, "brand") ?? "",
    subBrand: metadataString(source, "subBrand") ?? "",
    brandCategory: metadataString(source, "brandCategory") ?? "",
    country: metadataString(source, "country") ?? "United States of America",
    location: metadataString(source, "location") ?? "",
    locationType: metadataString(source, "locationType") ?? "",
    experienceLevel: metadataString(source, "experienceLevel") ?? "",
    city: metadataString(source, "city") ?? "",
    latitude: metadataString(source, "latitude") ?? "0",
    longitude: metadataString(source, "longitude") ?? "0",
    keyword: metadataString(source, "keyword") ?? "",
    language: metadataString(source, "language") ?? "undefined",
  };
  const query = Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");

  return `${apiUrl}?${query}`;
}

export function foxPostedAt(value: string) {
  const dateText = value.replace(/^Job Posting Date:\s*/i, "").trim();
  const parsed = new Date(dateText);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export function foxResults(html: string, publicBase: string) {
  return [
    ...html.matchAll(
      /<div\b[^>]*class=["'][^"']*\bjobListing\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    ),
  ]
    .map((match) => {
      const item = match[1];
      const link = item.match(
        /<a\b[^>]*class=["'][^"']*\bsearchResultTitle\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
      );

      if (!link) return null;

      const [, href, titleHtml] = link;
      const title = htmlToText(
        decodeHtml(titleHtml.replace(/<span\b[\s\S]*?<\/span>/gi, "")),
      )
        .replace(/\s+/g, " ")
        .trim();
      const brand = item.match(
        /<p\b[^>]*class=["'][^"']*\bsearchResultBrand\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
      )?.[1];
      const detailMatches = [
        ...item.matchAll(
          /<p\b[^>]*class=["'][^"']*\bsearchResultDetail\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi,
        ),
      ].map((detail) => htmlToText(decodeHtml(detail[1])).trim());
      const location =
        detailMatches.find((detail) => !/^Job Posting Date:/i.test(detail)) ??
        "";
      const dateText =
        detailMatches.find((detail) => /^Job Posting Date:/i.test(detail)) ??
        "";
      const sourceId =
        decodeHtml(href).match(/\/Search\/JobDetail\/([^/]+)/)?.[1] ??
        decodeHtml(href);

      return {
        applyUrl: new URL(decodeHtml(href), publicBase).toString(),
        brand: htmlToText(decodeHtml(brand ?? "")).trim(),
        dateText,
        location: location.replace(/;$/, "").trim(),
        sourceId,
        title,
      };
    })
    .filter((job): job is FoxSearchJob => Boolean(job?.title));
}

export async function fetchFoxJobs(
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
    metadataString(source, "publicBase") ?? "https://www.foxcareers.com";
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? FOX_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 0; page < maxPages; page += 1) {
    const response = await fetch(foxJobsListUrl(source, page), {
      headers: {
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "HireGeneralJobBoard/1.0",
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`Fox careers fetch failed: ${response.status}`);
    }

    const pageJobs = foxResults(await response.text(), publicBase);
    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      const sourceId = `${source.sourceSlug}:${job.sourceId}`;
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const searchText = `${job.title} ${job.brand} ${job.location}`;
      if (!isUsText(job.location)) continue;
      if (!isEngineeringText(searchText)) continue;
      if (isInternshipText(searchText)) continue;

      const description = safeDescription({
        title: job.title,
        companyName: source.companyName,
        description: `${job.title} role at ${source.companyName}. Visit the company careers site for the complete description and application details.`,
      });

      jobs.push({
        recruiterId,
        companyId: null,
        companyName: source.companyName,
        companyLogoUrl: source.companyLogoUrl ?? null,

        title: job.title,
        description,
        location: job.location || "United States",

        latitude: null,
        longitude: null,

        employmentType: normalizeEmploymentType(null),
        workMode: detectWorkMode(job.title, job.location),

        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: [],
        requirements: [],
        benefits: [],

        status: "published",

        postedAt: foxPostedAt(job.dateText),
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId,
        applyUrl: job.applyUrl,

        experienceLevel: null,
        category,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }
  }

  return jobs;
}
