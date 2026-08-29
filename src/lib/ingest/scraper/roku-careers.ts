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
import { decodeBasicHtml, metadataNumber, metadataString } from "./shared";

export const ROKU_DEFAULT_MAX_PAGES = 5;

export type RokuListJob = {
  id: string;
  title: string;
  href: string;
  location: string;
  category: string | null;
  searchText: string;
};

export function extractRokuJobs(html: string) {
  const matches = [
    ...html.matchAll(
      /<a\b[^>]*href=["']([^"']*\/jobs\/(?!search\b|saved\b|favorites\b)[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    ),
  ];
  const jobs: RokuListJob[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const href = decodeBasicHtml(match[1]);

    if (!href || /\/jobs\/search\b/i.test(href)) continue;

    const title = htmlToText(match[2]);
    if (!title || title.length < 4 || /^view\b/i.test(title)) continue;

    const start = match.index ?? 0;
    const nextStart = matches[index + 1]?.index ?? start + 2500;
    const blockHtml = html.slice(start, Math.min(nextStart, start + 2500));
    const blockText = htmlToText(blockHtml);
    const location =
      htmlToText(
        blockHtml.match(
          /(?:job-location|location|locations)[^>]*>([\s\S]{0,300}?)(?:<\/span>|<\/div>|<\/li>)/i,
        )?.[1],
      ) ||
      blockText.match(
        /\b(?:Remote|United States|California|New York|Texas|Georgia|Washington|Massachusetts|Colorado|Illinois|Florida|Oregon|Nevada|Arizona|New Jersey|New Jersey|New Mexico|Pennsylvania|North Carolina|Virginia|Maryland|District of Columbia|DC|CA|NY|TX|GA|WA|MA|CO|IL|FL|OR|NV|AZ|NJ|PA|NC|VA|MD)\b(?:[^·|\n]{0,80})/i,
      )?.[0] ||
      "United States";
    const category =
      htmlToText(
        blockHtml.match(
          /(?:job-category|department|team)[^>]*>([\s\S]{0,300}?)(?:<\/span>|<\/div>|<\/li>)/i,
        )?.[1],
      ) || null;
    const id =
      href.split("?")[0].split("#")[0].split("/").filter(Boolean).at(-1) ??
      normalizedJobTitleKey(title).replace(/\s+/g, "-");

    jobs.push({
      id,
      title,
      href,
      location,
      category,
      searchText: blockText,
    });
  }

  return jobs;
}

export async function fetchRokuJobs(
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
    metadataString(source, "publicBase") ?? "https://www.weareroku.com";
  const sourceUrl =
    source.sourceUrl ??
    metadataString(source, "searchUrl") ??
    new URL("/jobs/search", publicBase).toString();
  const maxPages = metadataNumber(source, "maxPages") ?? ROKU_DEFAULT_MAX_PAGES;
  const category = metadataString(source, "category") ?? "Technology";
  const seen = new Set<string>();
  const jobs: ImportedJob[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const pageUrl = new URL(sourceUrl);
    pageUrl.searchParams.set("page", String(page));
    pageUrl.searchParams.set("country_codes[]", "US");

    const response = await fetch(pageUrl, {
      headers: {
        Accept: "text/html",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`Roku fetch failed for page ${page}: ${response.status}`);
    }

    const pageJobs = extractRokuJobs(await response.text()).filter((job) => {
      const searchText = [job.title, job.category, job.location, job.searchText]
        .filter(Boolean)
        .join(" ");

      return (
        isUsText(searchText) &&
        isEngineeringText(searchText) &&
        !isInternshipText(searchText)
      );
    });

    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      const sourceId = `${source.sourceSlug}:${job.id}`;

      if (seen.has(sourceId)) continue;
      seen.add(sourceId);

      const applyUrl = new URL(job.href, publicBase).toString();
      const baseJob: ImportedJob = {
        recruiterId,
        companyId: null,
        companyName: source.companyName,
        companyLogoUrl: source.companyLogoUrl ?? null,
        title: job.title,
        description: safeDescription({
          description: `${job.title} role at ${source.companyName}.`,
          title: job.title,
          companyName: source.companyName,
        }),
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

        postedAt: new Date().toISOString(),
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId,
        applyUrl,

        experienceLevel: null,
        category: job.category || category,

        companyTagline: null,
        companySize: null,
        companyWebsite: source.companyDomain
          ? `https://${source.companyDomain}`
          : null,
      };

      jobs.push(
        await enhanceImportedJobFromDetailPage({
          job: baseJob,
          detailUrl: applyUrl,
          signal: context?.signal,
        }),
      );
    }
  }

  return jobs;
}
