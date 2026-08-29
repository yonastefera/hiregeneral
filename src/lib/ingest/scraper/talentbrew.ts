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
import { enhanceImportedJobFromDetailPage } from "../job-detail-extractor";
import {
  decodeHtml,
  includesAnyTerm,
  isNonJobTitle,
  metadataNumber,
  metadataString,
  metadataStringArray,
} from "./shared";

export type TalentBrewSearchJob = {
  applyUrl: string;
  category?: string;
  dateText: string;
  location: string;
  sourceId: string;
  title: string;
};

export const TALENTBREW_DEFAULT_ORG_ID = "185";

export const TALENTBREW_DEFAULT_MAX_PAGES = 6;

export function talentBrewSearchUrl(
  source: JobSource,
  searchTerm: string,
  page: number,
) {
  const publicBase =
    metadataString(source, "publicBase") ??
    source.sourceUrl ??
    "https://jobs.boeing.com";
  const orgId = metadataString(source, "orgId") ?? TALENTBREW_DEFAULT_ORG_ID;
  const keyword = encodeURIComponent(searchTerm.trim().replace(/\s+/g, "-"));
  const url = new URL(`/search-jobs/${keyword}/${orgId}/1`, publicBase);

  url.searchParams.set("p", String(page));

  return url;
}

export function talentBrewPostedAt(value: string) {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export function talentBrewCitiResults(html: string, publicBase: string) {
  return [
    ...html.matchAll(
      /<li\b[^>]*class=["'][^"']*\bsr-job-item\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi,
    ),
  ]
    .map((match): TalentBrewSearchJob | null => {
      const item = match[1];
      const link = item.match(
        /<a\b[^>]*class=["'][^"']*\bsr-job-item__link\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*data-job-id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
      );

      if (!link) return null;

      const [, href, sourceId, titleHtml] = link;
      const location = item.match(
        /<span\b[^>]*class=["'][^"']*\bsr-job-location\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
      )?.[1];
      const dateText = item.match(
        /<span\b[^>]*class=["'][^"']*\bsr-job-date\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
      )?.[1];

      return {
        applyUrl: new URL(decodeHtml(href), publicBase).toString(),
        dateText: htmlToText(decodeHtml(dateText ?? "")).trim(),
        location: htmlToText(decodeHtml(location ?? "")).trim(),
        sourceId,
        title: htmlToText(decodeHtml(titleHtml)).trim(),
      };
    })
    .filter((job): job is TalentBrewSearchJob => job !== null);
}

export function talentBrewSearchResultsList(html: string, publicBase: string) {
  const starts = [
    ...html.matchAll(
      /<li\b[^>]*class=["'][^"']*\bsearch-results-list__item\b/gi,
    ),
  ].map((match) => match.index ?? 0);

  return starts
    .map((start, index) => html.slice(start, starts[index + 1] ?? html.length))
    .map((match) => {
      const item = match;
      const link = item.match(
        /<a\b[^>]*class=["'][^"']*\bsearch-results-list__job-link\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*data-job-id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
      );

      if (!link) return null;

      const [, href, sourceId, titleHtml] = link;
      const location = item.match(
        /<li\b[^>]*class=["'][^"']*\bjob-location\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/i,
      )?.[1];

      return {
        applyUrl: new URL(decodeHtml(href), publicBase).toString(),
        dateText: "",
        location: htmlToText(decodeHtml(location ?? "")).trim(),
        sourceId,
        title: htmlToText(decodeHtml(titleHtml)).trim(),
      };
    })
    .filter((job): job is TalentBrewSearchJob => Boolean(job?.title));
}

export function talentBrewPlainResults(html: string, publicBase: string) {
  const section =
    html.match(
      /<section\b[^>]*id=["']search-results-list["'][^>]*>([\s\S]*?)<\/section>/i,
    )?.[1] ??
    html.match(
      /<div\b[^>]*id=["']search-results-list["'][^>]*>([\s\S]*?)<\/div>\s*<\/section>/i,
    )?.[1] ??
    "";

  return [...section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match): TalentBrewSearchJob | null => {
      const item = match[1];
      const link = item.match(
        /<a\b[^>]*href=["']([^"']+)["'][^>]*data-job-id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
      );

      if (!link) return null;

      const [, href, sourceId, body] = link;
      const title =
        body.match(
          /<h2\b[^>]*class=["']title["'][^>]*>([\s\S]*?)<\/h2>/i,
        )?.[1] ?? body.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1];
      const heading = title ?? body.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1];
      const location =
        body.match(
          /<span\b[^>]*class=["']location["'][^>]*>([\s\S]*?)<\/span>/i,
        )?.[1] ??
        body.match(
          /<span\b[^>]*class=["'][^"']*\bjob-location\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
        )?.[1];
      const category =
        body.match(
          /<span\b[^>]*class=["']category["'][^>]*>([\s\S]*?)<\/span>/i,
        )?.[1] ??
        body.match(
          /<span\b[^>]*class=["'][^"']*\bjob-category\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
        )?.[1];

      if (!heading) return null;

      return {
        applyUrl: new URL(decodeHtml(href), publicBase).toString(),
        category: htmlToText(decodeHtml(category ?? ""))
          .replace(/^Category:\s*/i, "")
          .trim(),
        dateText: "",
        location: htmlToText(decodeHtml(location ?? ""))
          .replace(/^Location:\s*/i, "")
          .trim(),
        sourceId,
        title: htmlToText(decodeHtml(heading)).trim(),
      };
    })
    .filter((job): job is TalentBrewSearchJob => job !== null);
}

export function talentBrewIsUsJob(job: TalentBrewSearchJob) {
  if (isUsText(job.location)) return true;

  const normalizedUrl = job.applyUrl.toLowerCase().replace(/[_/]+/g, "-");
  const knownUsPathMarkers = [
    "cambridge",
    "framingham",
    "bridgewater",
    "swiftwater",
    "waltham",
    "morristown",
    "new-york",
    "boston",
    "washington",
  ];

  return (
    /multiple\s+locations/i.test(job.location) &&
    knownUsPathMarkers.some((marker) => normalizedUrl.includes(marker))
  );
}

export function talentBrewResults(html: string, publicBase: string) {
  const defaultJobs = [
    ...html.matchAll(
      /<li\b[^>]*>([\s\S]*?<a class=["']search-results__job-link["'][\s\S]*?)<\/li>/gi,
    ),
  ]
    .map((match) => {
      const item = match[1];
      const link = item.match(
        /<a class=["']search-results__job-link["'] href=["']([^"']+)["'][^>]*data-job-id=["']([^"']+)["'][^>]*>\s*<span class=["']search-results__job-title["']>([\s\S]*?)<\/span>/i,
      );

      if (!link) return null;

      const [, href, sourceId, titleHtml] = link;
      const location = item.match(
        /<span class=["']search-results__job-info location["']>([\s\S]*?)<\/span>/i,
      )?.[1];
      const dateText = item.match(
        /<span class=["']search-results__job-info date["']>([\s\S]*?)<\/span>/i,
      )?.[1];

      return {
        applyUrl: new URL(decodeHtml(href), publicBase).toString(),
        dateText: htmlToText(decodeHtml(dateText ?? "")).trim(),
        location: htmlToText(decodeHtml(location ?? "")).trim(),
        sourceId,
        title: htmlToText(decodeHtml(titleHtml)).trim(),
      };
    })
    .filter((job): job is TalentBrewSearchJob => Boolean(job?.title));

  return [
    ...defaultJobs,
    ...talentBrewCitiResults(html, publicBase),
    ...talentBrewSearchResultsList(html, publicBase),
    ...talentBrewPlainResults(html, publicBase),
  ];
}

export async function fetchTalentBrewJobs(
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
    "https://jobs.boeing.com";
  const searchTerms = metadataStringArray(source, "searchTerms") ?? [
    "software",
    "engineering",
    "data",
    "cybersecurity",
  ];
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? TALENTBREW_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const requiredTerms = metadataStringArray(source, "requiredTerms") ?? [];
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const searchTerm of searchTerms) {
    for (let page = 1; page <= maxPages; page += 1) {
      const response = await fetch(
        talentBrewSearchUrl(source, searchTerm, page),
        {
          headers: {
            Accept: "text/html",
            "User-Agent": "HireGeneralJobBoard/1.0",
          },
          cache: "no-store",
          signal: context?.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`TalentBrew fetch failed: ${response.status}`);
      }

      const pageJobs = talentBrewResults(await response.text(), publicBase);
      if (pageJobs.length === 0) break;

      for (const job of pageJobs) {
        const sourceId = `${source.sourceSlug}:${job.sourceId}`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const searchText = `${job.title} ${job.category ?? ""} ${job.location} ${searchTerm}`;
        const sourceSearchText = `${job.title} ${job.category ?? ""} ${job.location}`;
        if (isNonJobTitle(job.title)) continue;
        if (!talentBrewIsUsJob(job)) continue;
        if (
          requiredTerms.length > 0 &&
          !includesAnyTerm(sourceSearchText, requiredTerms)
        )
          continue;
        if (!isEngineeringText(searchText)) continue;
        if (isInternshipText(searchText)) continue;

        const description = safeDescription({
          title: job.title,
          companyName: source.companyName,
          description: `${job.title} role at ${source.companyName}. Visit the company careers site for the complete description and application details.`,
        });

        const importedJob: ImportedJob = {
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

          postedAt: talentBrewPostedAt(job.dateText),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId,
          applyUrl: job.applyUrl,

          experienceLevel: null,
          category: job.category || category,

          companyTagline: null,
          companySize: null,
          companyWebsite,
        };

        const enhancedJob = await enhanceImportedJobFromDetailPage({
          job: importedJob,
          detailUrl: job.applyUrl,
          signal: context?.signal,
        });

        jobs.push(enhancedJob);
      }

      if (pageJobs.length < 15) break;
    }
  }

  return jobs;
}
