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

export const SOUTHERN_GLAZERS_DEFAULT_MAX_PAGES = 3;

export type SouthernGlazersListJob = {
  id: string;
  title: string;
  href: string;
  location: string;
  category: string;
};

export function extractSouthernGlazersJobs(html: string) {
  const jobs: SouthernGlazersListJob[] = [];

  for (const match of html.matchAll(
    /<a\s+href=["']([^"']*\/posting\/[^"']+)["'][^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/a>/gi,
  )) {
    const href = decodeBasicHtml(match[1]);
    const title = htmlToText(match[2]);
    const after = html.slice(match.index ?? 0, (match.index ?? 0) + 1400);
    const id =
      after.match(/Job ID:\s*<\/?[^>]*>\s*([0-9]+)/i)?.[1] ??
      href.match(/\/([0-9]+)-[^/]+$/)?.[1] ??
      normalizedJobTitleKey(title).replace(/\s+/g, "-");
    const location =
      htmlToText(
        after.match(/<label>Location<\/label>\s*<p[^>]*>([\s\S]*?)<\/p>/i)?.[1],
      ) || "United States";
    const category =
      htmlToText(
        after.match(/<label>Category<\/label>\s*<p[^>]*>([\s\S]*?)<\/p>/i)?.[1],
      ) || "IT";

    jobs.push({
      id,
      title,
      href,
      location,
      category,
    });
  }

  return jobs;
}

export async function fetchSouthernGlazersJobs(
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
    metadataString(source, "publicBase") ?? "https://jobs.southernglazers.com";
  const sourceUrl =
    source.sourceUrl ??
    metadataString(source, "searchUrl") ??
    new URL("/", publicBase).toString();
  const maxPages =
    metadataNumber(source, "maxPages") ?? SOUTHERN_GLAZERS_DEFAULT_MAX_PAGES;
  const category =
    metadataString(source, "category") ?? "Information Technology";
  const seen = new Set<string>();
  const jobs: ImportedJob[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const pageUrl = new URL(sourceUrl);
    pageUrl.searchParams.set("country", "US");
    pageUrl.searchParams.set("category", "IT");
    pageUrl.searchParams.set("spage", String(page));

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
        `Southern Glazer's fetch failed for page ${page}: ${response.status}`,
      );
    }

    const pageJobs = extractSouthernGlazersJobs(await response.text()).filter(
      (job) => {
        const searchText = [job.title, job.category, job.location].join(" ");

        return (
          isUsText(job.location) &&
          isEngineeringText(searchText) &&
          !isInternshipText(searchText)
        );
      },
    );

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
        location: job.location,

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
        category,

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
