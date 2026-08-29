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
import { decodeHtml, htmlAttribute, metadataString } from "./shared";

export type SuccessFactorsTileJob = {
  applyUrl: string;
  category: string | null;
  dateText: string | null;
  location: string;
  sourceId: string;
  title: string;
};

export function successFactorsTileBlocks(html: string) {
  const starts = [
    ...html.matchAll(/<li\b[^>]*class=["'][^"']*\bjob-tile\b/gi),
  ].map((match) => match.index ?? 0);

  return starts.map((start, index) =>
    html.slice(start, starts[index + 1] ?? html.length),
  );
}

export function successFactorsTileResults(html: string, publicBase: string) {
  return successFactorsTileBlocks(html)
    .map((block): SuccessFactorsTileJob | null => {
      const href =
        htmlAttribute(block, "data-url") ??
        block.match(
          /<a\b[^>]*class=["'][^"']*\bjobTitle-link\b[^"']*["'][^>]*href=["']([^"']+)["']/i,
        )?.[1];
      const title =
        block.match(
          /<a\b[^>]*class=["'][^"']*\bjobTitle-link\b[^"']*["'][^>]*>[\s\S]*?([^<>]+)[\s\S]*?<\/a>/i,
        )?.[1] ??
        block.match(
          /<span\b[^>]*class=["'][^"']*\bsection-title\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
        )?.[1];
      const location =
        block.match(
          /<div\b[^>]*section-location-value[^>]*>([\s\S]*?)<\/div>/i,
        )?.[1] ??
        block.match(
          /<div\b[^>]*class=["'][^"']*\blocation\b[^"']*["'][^>]*>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i,
        )?.[1];
      const dateText =
        block.match(
          /<div\b[^>]*section-date-value[^>]*>([\s\S]*?)<\/div>/i,
        )?.[1] ?? null;
      const category =
        block.match(
          /<div\b[^>]*section-department-value[^>]*>([\s\S]*?)<\/div>/i,
        )?.[1] ??
        block.match(
          /<div\b[^>]*section-dept-value[^>]*>([\s\S]*?)<\/div>/i,
        )?.[1] ??
        null;

      if (!href || !title) return null;

      const applyUrl = new URL(decodeHtml(href), publicBase).toString();

      return {
        applyUrl,
        category: category ? htmlToText(decodeHtml(category)).trim() : null,
        dateText: dateText ? htmlToText(decodeHtml(dateText)).trim() : null,
        location: location
          ? htmlToText(decodeHtml(location)).trim()
          : "United States",
        sourceId:
          htmlAttribute(block, "data-focus-tile")?.match(
            /job-id-([0-9]+)/,
          )?.[1] ?? decodeHtml(href),
        title: htmlToText(decodeHtml(title)).trim(),
      };
    })
    .filter((job): job is SuccessFactorsTileJob => Boolean(job?.title));
}

export function successFactorsTilePostedAt(value: string | null) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export async function fetchSuccessFactorsTileJobs(
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
    "https://jobs.pseg.com";
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const response = await fetch(source.sourceUrl ?? publicBase, {
    headers: {
      Accept: "text/html",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
    signal: context?.signal,
  });

  if (!response.ok) {
    throw new Error(`SuccessFactors tile fetch failed: ${response.status}`);
  }

  return successFactorsTileResults(await response.text(), publicBase)
    .filter((job) => {
      const searchText = `${job.title} ${job.category ?? ""} ${job.location}`;

      return (
        isUsText(job.location) &&
        isEngineeringText(searchText) &&
        !isInternshipText(searchText)
      );
    })
    .map((job) => ({
      recruiterId,
      companyId: null,
      companyName: source.companyName,
      companyLogoUrl: source.companyLogoUrl ?? null,

      title: job.title,
      description: safeDescription({
        title: job.title,
        companyName: source.companyName,
        description: `${job.title} role at ${source.companyName}. Visit the company careers site for the complete description and application details.`,
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

      postedAt: successFactorsTilePostedAt(job.dateText),
      expiresAt: defaultExpiryDate(30),

      sourceName: "scraper",
      sourceId: `${source.sourceSlug}:${job.sourceId}`,
      applyUrl: job.applyUrl,

      experienceLevel: null,
      category: job.category || category,

      companyTagline: null,
      companySize: null,
      companyWebsite,
    }));
}
