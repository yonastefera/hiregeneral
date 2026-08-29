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
  includesAnyTerm,
  isNonJobTitle,
  metadataNumber,
  metadataString,
  metadataStringArray,
} from "./shared";

export const AVATURE_DEFAULT_PAGE_SIZE = 10;

export const AVATURE_DEFAULT_MAX_PAGES = 4;

export function avatureClassText(article: string, className: string) {
  const match = article.match(
    new RegExp(`<span class=["']${className}["']>([\\s\\S]*?)<\\/span>`, "i"),
  );

  return match ? htmlToText(decodeHtml(match[1])).trim() : "";
}

export function avaturePostedAt(value: string) {
  const dateText = value.replace(/^Date Posted\s+/i, "").trim();
  const match = dateText.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);

  if (match) {
    const [, day, monthName, year] = match;
    const month = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ].indexOf(monthName.toLowerCase());

    if (month >= 0) {
      return new Date(Date.UTC(Number(year), month, Number(day))).toISOString();
    }
  }

  const parsed = new Date(dateText);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export function avaturePageUrl(
  source: JobSource,
  pageSize: number,
  offset: number,
) {
  const sourceUrl = source.sourceUrl ?? "https://smurfitwestrockta.avature.net";
  const pageSizeParam =
    metadataString(source, "pageSizeParam") ?? "folderRecordsPerPage";
  const offsetParam = metadataString(source, "offsetParam") ?? "folderOffset";
  const url = new URL(sourceUrl);

  url.searchParams.set(pageSizeParam, String(pageSize));

  if (offset > 0) {
    url.searchParams.set(offsetParam, String(offset));
  }

  return url;
}

export function parseAvatureArticle(source: JobSource, article: string) {
  const linkMatch =
    article.match(
      /<a\b(?=[^>]*class=["'][^"']*\blink\b)(?=[^>]*href=["']([^"']+)["'])[^>]*>([\s\S]*?)<\/a\s*>/i,
    ) ??
    article.match(
      /<h3\b[^>]*class=["'][^"']*\barticle__header__text__title\b[\s\S]*?<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a\s*>/i,
    );

  if (!linkMatch) return null;

  const [, href, titleHtml] = linkMatch;
  const title = htmlToText(decodeHtml(titleHtml)).replace(/\s+/g, " ").trim();
  const sourceUrl = source.sourceUrl ?? "https://smurfitwestrockta.avature.net";
  const applyUrl = new URL(decodeHtml(href), sourceUrl).toString();
  const subtitle = article.match(
    /<div\b[^>]*class=["'][^"']*\barticle__header__text__subtitle\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  )?.[1];
  const subtitleText = htmlToText(decodeHtml(subtitle ?? ""))
    .replace(/\s+/g, " ")
    .trim();
  const location =
    avatureClassText(article, "list-item-location") ||
    subtitleText
      .replace(/\s*,?\s*Ref\s*#.*$/i, "")
      .replace(/\s*,?\s*Posted\s+.*$/i, "")
      .replace(/\s+,/g, ",")
      .trim();
  const employmentType = avatureClassText(article, "list-item-type");
  const postedText =
    avatureClassText(article, "list-item-posted") ||
    subtitleText.match(/\bPosted\s+([A-Za-z]{3}-\d{2}-\d{4})/i)?.[1] ||
    "";
  const jobId =
    avatureClassText(article, "list-item-ref").replace(/^Job ID:\s*/i, "") ||
    subtitleText.match(/\bRef\s*#\s*([A-Za-z0-9-]+)/i)?.[1] ||
    href.match(/\/(\d+)(?:[/?#]|$)/)?.[1] ||
    "";

  if (!title) return null;

  return {
    title,
    applyUrl,
    location,
    employmentType,
    postedAt: postedText
      ? avaturePostedAt(postedText)
      : new Date().toISOString(),
    jobId,
  };
}

export function avatureArticleBlocks(html: string) {
  const starts = [
    ...html.matchAll(
      /<article\b[^>]*class=["'][^"']*\barticle--result\b[^"']*["'][^>]*>/gi,
    ),
  ].map((match) => match.index ?? 0);

  return starts.map((start, index) =>
    html.slice(start, starts[index + 1] ?? html.length),
  );
}

export function parseAvatureJobs(source: JobSource, html: string) {
  const articleJobs = avatureArticleBlocks(html)
    .map((article) => parseAvatureArticle(source, article))
    .filter((job): job is NonNullable<typeof job> => Boolean(job));

  if (articleJobs.length > 0) {
    return articleJobs;
  }

  return parseAvatureStructuredJobs(source, html);
}

export function avatureStructuredLocation(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(avatureStructuredLocation).filter(Boolean).join(" | ");
  }

  if (typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  const address = record.address;

  if (address && typeof address === "object") {
    const addressRecord = address as Record<string, unknown>;
    return [
      addressRecord.addressLocality,
      addressRecord.addressRegion,
      addressRecord.addressCountry,
    ]
      .filter((part): part is string => typeof part === "string" && part !== "")
      .join(", ");
  }

  return [
    record.name,
    record.addressLocality,
    record.addressRegion,
    record.addressCountry,
  ]
    .filter((part): part is string => typeof part === "string" && part !== "")
    .join(", ");
}

export function avatureStructuredApplyUrl(
  source: JobSource,
  record: Record<string, unknown>,
) {
  const sourceUrl = source.sourceUrl ?? "https://smurfitwestrockta.avature.net";
  const url = record.url;

  if (typeof url === "string" && url.trim()) {
    return new URL(decodeHtml(url), sourceUrl).toString();
  }

  const identifier = record.identifier;
  const id =
    typeof identifier === "string"
      ? identifier
      : identifier && typeof identifier === "object"
        ? (identifier as Record<string, unknown>).value
        : null;

  if (typeof id === "string" && id.trim()) {
    const fallback = new URL(sourceUrl);
    fallback.searchParams.set("pid", id);
    return fallback.toString();
  }

  return sourceUrl;
}

export function avatureStructuredJobId(record: Record<string, unknown>) {
  const identifier = record.identifier;

  if (typeof identifier === "string") return identifier;

  if (identifier && typeof identifier === "object") {
    const value = (identifier as Record<string, unknown>).value;
    if (typeof value === "string") return value;
  }

  const url = record.url;
  if (typeof url === "string") {
    const pid = new URL(url, "https://example.com").searchParams.get("pid");
    if (pid) return pid;
    return url.match(/\/(\d+)(?:[/?#]|$)/)?.[1] ?? "";
  }

  return "";
}

export function parseAvatureStructuredJobs(source: JobSource, html: string) {
  return [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ]
    .flatMap((match) => {
      try {
        const parsed = JSON.parse(decodeHtml(match[1]).trim()) as unknown;
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    })
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        (item as Record<string, unknown>)["@type"] === "JobPosting",
    )
    .map((record) => {
      const title = typeof record.title === "string" ? record.title.trim() : "";
      if (!title) return null;

      return {
        title,
        applyUrl: avatureStructuredApplyUrl(source, record),
        location: avatureStructuredLocation(record.jobLocation),
        employmentType:
          typeof record.employmentType === "string"
            ? record.employmentType
            : "",
        postedAt:
          typeof record.datePosted === "string"
            ? avaturePostedAt(record.datePosted)
            : new Date().toISOString(),
        jobId: avatureStructuredJobId(record),
      };
    })
    .filter((job): job is NonNullable<typeof job> => Boolean(job));
}

export async function fetchAvatureJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  if (!source.sourceUrl) {
    throw new Error(
      `Avature source ${source.companyName} is missing source_url`,
    );
  }

  const pageSize =
    metadataNumber(source, "pageSize") ?? AVATURE_DEFAULT_PAGE_SIZE;
  const maxPages =
    metadataNumber(source, "maxPages") ?? AVATURE_DEFAULT_MAX_PAGES;
  const category = metadataString(source, "category") ?? "Technology";
  const country = metadataString(source, "country");
  const requiredTerms = metadataStringArray(source, "requiredTerms") ?? [];
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 0; page < maxPages; page += 1) {
    const offset = page * pageSize;
    const response = await fetch(avaturePageUrl(source, pageSize, offset), {
      headers: {
        Accept: "text/html",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    const body = await response.text();

    if (!response.ok) {
      throw new Error(`Avature fetch failed: ${response.status}`);
    }

    const pageJobs = parseAvatureJobs(source, body);
    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      const sourceId = `${source.sourceSlug}:${job.jobId || job.applyUrl}`;
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const locationText = [job.location, country].filter(Boolean).join(", ");
      const searchText = `${job.title} ${locationText} ${category}`;
      const sourceSearchText = `${job.title} ${job.location} ${job.employmentType}`;
      if (isNonJobTitle(job.title)) continue;
      if (!isUsText(locationText)) continue;
      if (
        requiredTerms.length > 0 &&
        !includesAnyTerm(sourceSearchText, requiredTerms)
      )
        continue;
      if (!isEngineeringText(searchText)) continue;
      if (isInternshipText(searchText)) continue;

      const description = `${job.title} role on ${source.companyName}'s ${category} team.`;

      jobs.push({
        recruiterId,
        companyId: null,
        companyName: source.companyName,
        companyLogoUrl: source.companyLogoUrl ?? null,

        title: job.title,
        description: safeDescription({
          description,
          title: job.title,
          companyName: source.companyName,
        }),
        location:
          job.location && job.location !== "Multiple Locations"
            ? locationText
            : country || "United States",

        latitude: null,
        longitude: null,

        employmentType: normalizeEmploymentType(job.employmentType),
        workMode: detectWorkMode(job.title, job.location),

        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: [],
        requirements: [],
        benefits: [],

        status: "published",

        postedAt: job.postedAt,
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId,
        applyUrl: job.applyUrl,

        experienceLevel: null,
        category,

        companyTagline: null,
        companySize: null,
        companyWebsite: source.companyDomain
          ? `https://${source.companyDomain}`
          : null,
      });
    }

    if (pageJobs.length < pageSize) break;
  }

  return jobs;
}
