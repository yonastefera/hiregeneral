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
  decodeHtml,
  htmlAttribute,
  metadataNumber,
  metadataString,
} from "./shared";

export type StgHavasSearchJob = {
  applyUrl: string;
  category: string;
  location: string;
  sourceId: string;
  title: string;
};

export const STG_HAVAS_DEFAULT_MAX_PAGES = 4;

export function stgHavasPageUrl(source: JobSource, page: number) {
  const url = new URL(
    source.sourceUrl ??
      "https://search-ihgcareers.stghavaspeople.com/en/search-and-apply/",
  );

  if (page > 1) {
    url.searchParams.set("page", String(page));
  }

  return url;
}

export function stgHavasResultBlocks(html: string) {
  const starts = [
    ...html.matchAll(/<div\b[^>]*class=["'][^"']*\bitem\b/gi),
  ].map((match) => match.index ?? 0);

  return starts.map((start, index) =>
    html.slice(start, starts[index + 1] ?? html.length),
  );
}

export function stgHavasResults(html: string, publicBase: string) {
  return stgHavasResultBlocks(html)
    .map((block) => {
      const jobSection = block.match(
        /<div\b[^>]*class=["'][^"']*\blatest-jobs-section-jobs_department\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<div\b[^>]*class=["'][^"']*\blatest-jobs-section-jobs_location\b/i,
      )?.[1];
      const locationSection = block.match(
        /<div\b[^>]*class=["'][^"']*\blatest-jobs-section-jobs_location\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<div\b[^>]*class=["'][^"']*\blatest-jobs-section-jobs_link\b/i,
      )?.[1];

      if (!jobSection || !locationSection) return null;

      const href = jobSection.match(/<a\b[^>]*href=["']([^"']+)["']/i)?.[1];
      const title = jobSection.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1];
      const category = [...jobSection.matchAll(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi)]
        .map((match) => htmlToText(decodeHtml(match[1])).trim())
        .filter(Boolean)
        .join(" ");
      const location = [
        locationSection.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1],
        locationSection.match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i)?.[1],
      ]
        .map((value) => htmlToText(decodeHtml(value ?? "")).trim())
        .filter(Boolean)
        .join(", ");

      if (!href || !title) return null;

      const decodedHref = decodeHtml(href);
      const sourceId =
        decodedHref.match(/[?&]jobref=([^&#]+)/)?.[1] ??
        htmlAttribute(block, "data-anchor") ??
        decodedHref;

      return {
        applyUrl: new URL(decodedHref, publicBase).toString(),
        category,
        location,
        sourceId,
        title: htmlToText(decodeHtml(title)).trim(),
      };
    })
    .filter((job): job is StgHavasSearchJob => Boolean(job?.title));
}

export async function fetchStgHavasJobs(
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
    source.sourceUrl ??
    "https://search-ihgcareers.stghavaspeople.com";
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? STG_HAVAS_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetch(stgHavasPageUrl(source, page), {
      headers: {
        Accept: "text/html",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`STG Havas careers fetch failed: ${response.status}`);
    }

    const pageJobs = stgHavasResults(await response.text(), publicBase);
    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      const sourceId = `${source.sourceSlug}:${job.sourceId}`;
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const searchText = `${job.title} ${job.category} ${job.location}`;
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
        workMode: detectWorkMode(`${job.title} ${job.category}`, job.location),

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
        applyUrl: job.applyUrl,

        experienceLevel: null,
        category: job.category || category,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }
  }

  return jobs;
}
