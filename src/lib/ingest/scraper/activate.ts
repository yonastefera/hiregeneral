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
  metadataNumber,
  metadataString,
  metadataStringArray,
  recordString,
  splitListItems,
  uniqueItems,
} from "./shared";

export type ActivateSearchResponse = {
  jobsHtml?: string;
  paginationHtml?: string;
  hasResults?: boolean;
};

export type ActivateSearchJob = {
  detailUrl: string;
  location: string;
  locationSearchText: string;
  sourceId: string;
  title: string;
};

export type ActivateJobPostingSchema = {
  "@type"?: string;
  title?: string;
  description?: string;
  employmentType?: string;
  datePosted?: string;
  industry?: string;
  jobLocation?: unknown;
};

export const ACTIVATE_DEFAULT_PAGE_SIZE = 12;

export const ACTIVATE_DEFAULT_MAX_PAGES = 5;

export function activateSearchUrl(
  source: JobSource,
  categoryId: string,
  page: number,
) {
  const base =
    source.sourceUrl ??
    metadataString(source, "publicBase") ??
    "https://jobs.cardinalhealth.com";
  const url = new URL("/search/searchresultslist", base);

  url.searchParams.set("CategoryID", categoryId);
  if (page > 1) url.searchParams.set("page", String(page));

  return url;
}

export function activateClassDd(html: string, className: string) {
  const match = html.match(
    new RegExp(
      `<div[^>]+class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>[\\s\\S]*?<dd>([\\s\\S]*?)<\\/dd>`,
      "i",
    ),
  );

  return match?.[1] ?? "";
}

export function activateSpans(html: string) {
  return uniqueItems(
    [...html.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)]
      .map((match) => htmlToText(decodeHtml(match[1])).trim())
      .filter(Boolean),
  );
}

export function parseActivateSearchJobs(source: JobSource, html: string) {
  return [
    ...html.matchAll(
      /<li\b(?=[^>]*\bjob-item\b)[^>]*data-record-key=["']([^"']+)["'][^>]*>([\s\S]*?)<\/li>/gi,
    ),
  ]
    .map((match): ActivateSearchJob | null => {
      const [, recordKey, itemHtml] = match;
      const titleMatch = itemHtml.match(
        /<h3[^>]+class=["'][^"']*\bjob-title\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i,
      );
      const linkMatch = itemHtml.match(
        /<a\b(?=[^>]*\bview-details-link\b)[^>]*href=["']([^"']+)["'][^>]*>/i,
      );
      const title = titleMatch
        ? htmlToText(decodeHtml(titleMatch[1])).replace(/\s+/g, " ").trim()
        : "";
      const href = linkMatch?.[1];

      if (!title || !href) return null;

      const cityStateBlock = activateClassDd(itemHtml, "city-state-column");
      const countryBlock = activateClassDd(itemHtml, "country-column");
      const locations = activateSpans(cityStateBlock);
      const countries = activateSpans(countryBlock);
      const location = locations.join(", ") || countries.join(", ");
      const base = source.sourceUrl ?? "https://jobs.cardinalhealth.com";

      return {
        detailUrl: new URL(decodeHtml(href), base).toString(),
        location,
        locationSearchText: [...locations, ...countries].join(" "),
        sourceId: `${source.sourceSlug}:${recordKey}`,
        title,
      };
    })
    .filter((job): job is ActivateSearchJob => Boolean(job));
}

export function activateJobPostingSchema(html: string) {
  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]).trim()) as
        | ActivateJobPostingSchema
        | ActivateJobPostingSchema[];
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      const jobPosting = candidates.find(
        (item) =>
          item &&
          typeof item === "object" &&
          recordString(item, ["@type"]).toLowerCase() === "jobposting",
      );

      if (jobPosting) return jobPosting;
    } catch {
      continue;
    }
  }

  return null;
}

export function activateSchemaLocations(
  schema: ActivateJobPostingSchema | null,
) {
  const rawLocations = schema?.jobLocation;
  const locations = Array.isArray(rawLocations)
    ? rawLocations
    : rawLocations
      ? [rawLocations]
      : [];

  return uniqueItems(
    locations
      .map((location) => {
        const record =
          location && typeof location === "object"
            ? (location as Record<string, unknown>)
            : {};
        const address =
          record.address && typeof record.address === "object"
            ? (record.address as Record<string, unknown>)
            : record;
        const country = recordString(address, [
          "addressCountry",
          "country",
        ]).replace(/^US$/i, "United States");

        return [
          recordString(address, ["addressLocality", "city"]),
          recordString(address, ["addressRegion", "state"]),
          country && country !== "United States" ? country : "",
        ]
          .filter(Boolean)
          .join(", ");
      })
      .filter(Boolean),
  );
}

export function activateApplyUrl(html: string, fallback: string) {
  const match = html.match(
    /<a\b(?=[^>]*\bapply-external\b)[^>]*href=["']([^"']+)["'][^>]*>/i,
  );

  return match?.[1] ? decodeHtml(match[1]) : fallback;
}

export function activatePostedAt(value: string | null | undefined) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export function activateLocationLabel(locations: string[], fallback: string) {
  if (locations.length === 0) return fallback || "United States";

  const [first] = locations;
  const hiddenCount = locations.length - 1;

  return hiddenCount > 0 ? `${first}, ${hiddenCount} locations` : first;
}

export async function fetchActivateJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const categoryIds = metadataStringArray(source, "categoryIds") ?? [];
  if (categoryIds.length === 0) {
    throw new Error(
      `Activate source ${source.companyName} is missing categoryIds metadata`,
    );
  }

  const pageSize = Math.max(
    metadataNumber(source, "pageSize") ?? ACTIVATE_DEFAULT_PAGE_SIZE,
    1,
  );
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? ACTIVATE_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const categoryId of categoryIds) {
    for (let page = 1; page <= maxPages; page += 1) {
      const response = await fetch(
        activateSearchUrl(source, categoryId, page),
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "HireGeneralJobBoard/1.0",
          },
          cache: "no-store",
          signal: context?.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Activate fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as ActivateSearchResponse;
      const pageJobs = parseActivateSearchJobs(source, data.jobsHtml ?? "");

      if (pageJobs.length === 0) break;

      for (const listing of pageJobs) {
        if (seenSourceIds.has(listing.sourceId)) continue;
        seenSourceIds.add(listing.sourceId);

        if (!isUsText(listing.locationSearchText)) continue;

        const detailResponse = await fetch(listing.detailUrl, {
          headers: {
            Accept: "text/html,application/xhtml+xml",
            "User-Agent": "HireGeneralJobBoard/1.0",
          },
          cache: "no-store",
          signal: context?.signal,
        });
        const detailHtml = await detailResponse.text();

        if (!detailResponse.ok) continue;

        const schema = activateJobPostingSchema(detailHtml);
        const title = schema?.title?.trim() || listing.title;
        const rawDescription = schema?.description
          ? htmlToText(schema.description)
          : "";
        const description = safeDescription({
          description: rawDescription,
          title,
          companyName: source.companyName,
        });
        const schemaLocations = activateSchemaLocations(schema);
        const location = activateLocationLabel(
          schemaLocations,
          listing.location,
        );
        const searchText = [
          title,
          description,
          schema?.industry,
          category,
          location,
        ]
          .filter(Boolean)
          .join(" ");

        if (!isUsText(`${location} ${listing.locationSearchText}`)) continue;
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

          employmentType: normalizeEmploymentType(schema?.employmentType),
          workMode: detectWorkMode(title, location),

          salaryMin: null,
          salaryMax: null,
          salaryCurrency: "USD",

          skills: [],
          responsibilities: splitListItems(description, 12),
          requirements: splitListItems(description, 14),
          benefits: [],

          status: "published",

          postedAt: activatePostedAt(schema?.datePosted),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId: listing.sourceId,
          applyUrl: activateApplyUrl(detailHtml, listing.detailUrl),

          experienceLevel: null,
          category: schema?.industry ?? category,

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
