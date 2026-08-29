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

export const ATOM_FEED_DEFAULT_MAX_JOBS = 80;

export function metadataBoolean(source: JobSource, key: string) {
  const value = source.metadata[key];

  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;

  if (/^(true|1|yes)$/i.test(value.trim())) return true;
  if (/^(false|0|no)$/i.test(value.trim())) return false;

  return null;
}

export function includesAnyConfiguredTerm(value: string, terms: string[]) {
  const lower = value.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

export type AtomFeedJob = {
  id: string;
  title: string;
  href: string;
  location: string;
  description: string;
  postedAt: string | null;
  searchText: string;
};

export function textBetween(value: string, tagName: string) {
  const match = value.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );

  return match ? decodeBasicHtml(htmlToText(match[1])).trim() : "";
}

export function firstXmlAttribute(
  value: string,
  tagName: string,
  attribute: string,
) {
  const tagMatch = value.match(new RegExp(`<${tagName}\\b[^>]*>`, "i"));
  if (!tagMatch) return "";

  const attrMatch = tagMatch[0].match(
    new RegExp(`${attribute}=["']([^"']+)["']`, "i"),
  );

  return attrMatch ? decodeBasicHtml(attrMatch[1]).trim() : "";
}

export function extractFeedBlocks(xml: string) {
  const atomEntries = [
    ...xml.matchAll(/<entry\b[^>]*>[\s\S]*?<\/entry>/gi),
  ].map((match) => match[0]);

  if (atomEntries.length > 0) return atomEntries;

  return [...xml.matchAll(/<item\b[^>]*>[\s\S]*?<\/item>/gi)].map(
    (match) => match[0],
  );
}

export function extractFeedLink(block: string) {
  const alternate =
    block.match(
      /<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i,
    )?.[1] ??
    block.match(/<link\b(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i)?.[1] ??
    textBetween(block, "link");

  return decodeBasicHtml(alternate ?? "").trim();
}

export function inferLocationFromFeedText(value: string, fallback: string) {
  const parenthetical = value.match(/\(([^)]{2,80})\)/)?.[1]?.trim();
  if (parenthetical && isUsText(parenthetical)) return parenthetical;

  const cityState = value.match(
    /\b([A-Z][A-Za-z .'-]+,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DC|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY))\b/,
  )?.[1];

  if (cityState) return cityState;

  if (/\bnew york\b/i.test(value)) return "New York, NY, United States";
  if (/\bhouston\b/i.test(value)) return "Houston, TX, United States";
  if (/\bchicago\b/i.test(value)) return "Chicago, IL, United States";
  if (/\batlanta\b/i.test(value)) return "Atlanta, GA, United States";

  return fallback;
}

export function extractAtomFeedJobs(xml: string, fallbackLocation: string) {
  return extractFeedBlocks(xml)
    .map((block): AtomFeedJob | null => {
      const title = textBetween(block, "title");
      const href = extractFeedLink(block);
      const content =
        textBetween(block, "content") ||
        textBetween(block, "summary") ||
        textBetween(block, "description");
      const id =
        textBetween(block, "id") ||
        textBetween(block, "guid") ||
        href ||
        normalizedJobTitleKey(title).replace(/\s+/g, "-");
      const postedAt =
        textBetween(block, "published") ||
        textBetween(block, "updated") ||
        textBetween(block, "pubDate");
      const location =
        firstXmlAttribute(block, "location", "name") ||
        inferLocationFromFeedText(
          `${title} ${content} ${href}`,
          fallbackLocation,
        );

      if (!title || !href) return null;

      return {
        id,
        title,
        href,
        location,
        description: content,
        postedAt:
          postedAt && !Number.isNaN(Date.parse(postedAt)) ? postedAt : null,
        searchText: [title, location, content, href].join(" "),
      };
    })
    .filter((job): job is AtomFeedJob => Boolean(job));
}

export async function fetchAtomFeedJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const feedUrl = metadataString(source, "feedUrl") ?? source.sourceUrl;

  if (!feedUrl) {
    throw new Error(`Missing feedUrl for ${source.sourceSlug}`);
  }

  const publicBase =
    metadataString(source, "publicBase") ?? new URL(feedUrl).origin;
  const fallbackLocation =
    metadataString(source, "locationFallback") ?? "United States";
  const maxJobs =
    metadataNumber(source, "maxJobs") ?? ATOM_FEED_DEFAULT_MAX_JOBS;
  const category = metadataString(source, "category") ?? "Technology";
  const requireUs = metadataBoolean(source, "requireUs") ?? true;
  const requireEngineering =
    metadataBoolean(source, "requireEngineering") ?? true;
  const excludedTerms = metadataStringArray(source, "excludedTerms") ?? [];
  const enhanceDetails = source.metadata?.enhanceDetails !== false;
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);

  const response = await fetch(feedUrl, {
    headers: {
      Accept:
        "application/atom+xml, application/rss+xml, application/xml, text/xml",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
    signal: context?.signal,
  });

  if (!response.ok) {
    throw new Error(`Atom feed fetch failed: ${response.status}`);
  }

  const seen = new Set<string>();
  const jobs: ImportedJob[] = [];
  const feedJobs = extractAtomFeedJobs(await response.text(), fallbackLocation)
    .filter((job) => {
      return (
        !includesAnyConfiguredTerm(job.searchText, excludedTerms) &&
        (!requireUs || isUsText(job.searchText)) &&
        (!requireEngineering || isEngineeringText(job.searchText)) &&
        !isInternshipText(job.searchText)
      );
    })
    .slice(0, maxJobs);

  for (const job of feedJobs) {
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
        description: job.description,
        title: job.title,
        companyName: source.companyName,
      }),
      location: job.location || fallbackLocation,

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

      postedAt: job.postedAt ?? new Date().toISOString(),
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

    if (!enhanceDetails) {
      jobs.push(baseJob);
      continue;
    }

    jobs.push(
      await enhanceImportedJobFromDetailPage({
        job: baseJob,
        detailUrl: applyUrl,
        signal: context?.signal,
      }),
    );
  }

  return jobs;
}
