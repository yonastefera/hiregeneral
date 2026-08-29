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
  isoDateFromText,
  metadataNumber,
  metadataString,
  numberRangeFromText,
} from "./shared";

export const ATTRAX_DEFAULT_MAX_PAGES = 3;

export function attraxTileBlocks(html: string) {
  const starts = [
    ...html.matchAll(/<div\b[^>]*class=["'][^"']*\battrax-vacancy-tile\b/gi),
  ].map((match) => match.index ?? 0);

  return starts.map((start, index) =>
    html.slice(start, starts[index + 1] ?? html.length),
  );
}

export function attraxValue(block: string, className: string) {
  const classPattern = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const section = block.match(
    new RegExp(
      `<[^>]*class=["'][^"']*\\b${classPattern}\\b[^"']*["'][^>]*>([\\s\\S]*?)(?=<div\\b[^>]*class=["'][^"']*\\battrax-vacancy-tile__|<a\\b[^>]*class=["'][^"']*\\battrax-vacancy-tile__|$)`,
      "i",
    ),
  )?.[1];

  if (!section) return "";

  const value =
    section.match(
      /<p\b[^>]*class=["'][^"']*\battrax-vacancy-tile__item-value\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
    )?.[1] ?? section;

  return htmlToText(decodeHtml(value)).replace(/\s+/g, " ").trim();
}

export function attraxPageUrl(source: JobSource, page: number) {
  const url = new URL(source.sourceUrl ?? "https://jobs.experian.com/jobs");
  url.searchParams.set("page", String(page));

  return url;
}

export async function fetchAttraxJobs(
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
    "https://jobs.experian.com";
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? ATTRAX_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetch(attraxPageUrl(source, page), {
      headers: {
        Accept: "text/html",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`Attrax fetch failed: ${response.status}`);
    }

    const blocks = attraxTileBlocks(await response.text());
    if (blocks.length === 0) break;

    for (const block of blocks) {
      const titleLink = block.match(
        /<a\b[^>]*class=["'][^"']*\battrax-vacancy-tile__title\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
      );
      if (!titleLink) continue;

      const sourceId =
        htmlAttribute(block, "data-jobid") || decodeHtml(titleLink[1]);
      const fullSourceId = `${source.sourceSlug}:${sourceId}`;
      if (seenSourceIds.has(fullSourceId)) continue;
      seenSourceIds.add(fullSourceId);

      const title = htmlToText(decodeHtml(titleLink[2]))
        .replace(/\s+/g, " ")
        .trim();
      const location =
        attraxValue(block, "attrax-vacancy-tile__location-freetext") ||
        attraxValue(block, "attrax-vacancy-tile__option-location") ||
        "United States";
      const roleType = attraxValue(
        block,
        "attrax-vacancy-tile__option-role-type",
      );
      const schedule = attraxValue(
        block,
        "attrax-vacancy-tile__option-schedule",
      );
      const salaryText = attraxValue(
        block,
        "attrax-vacancy-tile__option-salary-range",
      );
      const department = attraxValue(
        block,
        "attrax-vacancy-tile__option-department",
      );
      const description = safeDescription({
        description:
          attraxValue(block, "attrax-vacancy-tile__description") ||
          `${title} role at ${source.companyName}. Visit the company careers site for the full description and application details.`,
        title,
        companyName: source.companyName,
      });
      const searchText = `${title} ${department} ${description} ${category}`;

      if (!isUsText(location)) continue;
      if (!isEngineeringText(searchText)) continue;
      if (isInternshipText(searchText)) continue;

      const salary = numberRangeFromText(salaryText);

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

        employmentType: normalizeEmploymentType(schedule),
        workMode: detectWorkMode(`${title} ${roleType}`, location),

        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: [],
        requirements: [],
        benefits: [],

        status: "published",

        postedAt: new Date().toISOString(),
        expiresAt:
          isoDateFromText(attraxValue(block, "attrax-vacancy-tile__expiry")) ??
          defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId: fullSourceId,
        applyUrl: new URL(decodeHtml(titleLink[1]), publicBase).toString(),

        experienceLevel:
          attraxValue(block, "attrax-vacancy-tile__option-experience-level") ||
          null,
        category: department || category,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }
  }

  return jobs;
}
