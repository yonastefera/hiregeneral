import {
  defaultExpiryDate,
  detectWorkMode,
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
import {
  isNonJobTitle,
  isoDateFromText,
  metadataNumber,
  metadataString,
  metadataStringArray,
  numberRangeFromText,
  recordString,
  splitListItems,
  uniqueItems,
} from "./shared";

export type NlxSolrJob = {
  date_new?: string;
  date_updated?: string;
  description?: string;
  guid?: string;
  id?: string;
  job_category?: string;
  job_function?: string;
  job_type?: string;
  location_exact?: string;
  other?: string;
  reqid?: string;
  title_exact?: string;
};

export type NlxSolrResponse = {
  featured_jobs?: NlxSolrJob[];
  jobs?: NlxSolrJob[];
  pagination?: {
    has_more_pages?: boolean;
    total?: number;
  };
};

export const NLX_SOLR_DEFAULT_API_BASE =
  "https://prod-search-api.jobsyn.org/api";

export const NLX_SOLR_DEFAULT_PAGE_SIZE = 10;

export const NLX_SOLR_DEFAULT_MAX_PAGES = 4;

export function nlxSolrOther(job: NlxSolrJob) {
  if (!job.other) return {};

  try {
    const parsed = JSON.parse(job.other) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function nlxSolrUrl(
  source: JobSource,
  searchTerm: string,
  offset: number,
) {
  const apiBase =
    metadataString(source, "apiBase") ?? NLX_SOLR_DEFAULT_API_BASE;
  const endpoint = metadataString(source, "endpoint") ?? "v1/solr/search";
  const url = new URL(endpoint, `${apiBase.replace(/\/$/, "")}/`);
  const buids = metadataStringArray(source, "buids") ?? [];
  const pageSize =
    metadataNumber(source, "pageSize") ?? NLX_SOLR_DEFAULT_PAGE_SIZE;
  const categorySlug = metadataString(source, "categorySlug");

  url.searchParams.set("q", searchTerm);
  url.searchParams.set("num_items", String(pageSize));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("source", "solr");

  for (const buid of buids) {
    url.searchParams.append("buids", buid);
  }

  if (categorySlug) {
    url.searchParams.set("positioncategory", categorySlug);
  }

  return url;
}

export async function fetchNlxSolrJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const origin = metadataString(source, "origin") ?? source.companyDomain;
  if (!origin) {
    throw new Error(`NLX Solr source ${source.companyName} is missing origin`);
  }

  const searchTerms = uniqueItems(
    metadataStringArray(source, "searchTerms") ?? [
      "software",
      "data",
      "technology",
      "security",
    ],
  );
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? NLX_SOLR_DEFAULT_MAX_PAGES,
    1,
  );
  const pageSize =
    metadataNumber(source, "pageSize") ?? NLX_SOLR_DEFAULT_PAGE_SIZE;
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const searchTerm of searchTerms) {
    for (let page = 0; page < maxPages; page += 1) {
      const response = await fetch(
        nlxSolrUrl(source, searchTerm, page * pageSize),
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "HireGeneralJobBoard/1.0",
            "X-Origin": origin,
          },
          cache: "no-store",
          signal: context?.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`NLX Solr fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as NlxSolrResponse;
      const pageJobs = [...(data.featured_jobs ?? []), ...(data.jobs ?? [])];

      if (pageJobs.length === 0) break;

      for (const job of pageJobs) {
        const title = recordString(job, ["title_exact"]);
        if (!title) continue;

        const sourceId = `${source.sourceSlug}:${
          recordString(job, ["guid", "reqid", "id"]) ||
          normalizedJobTitleKey(title)
        }`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const location =
          recordString(job, ["location_exact"]) || "United States";
        const other = nlxSolrOther(job);
        const remoteType =
          typeof other["Remote Type"] === "string" ? other["Remote Type"] : "";
        const salary = numberRangeFromText(
          typeof other["Pay Range"] === "string" ? other["Pay Range"] : "",
        );
        const description = safeDescription({
          description: recordString(job, ["description"]),
          title,
          companyName: source.companyName,
        });
        const searchText = [
          title,
          description,
          recordString(job, ["job_category", "job_function"]),
          category,
          searchTerm,
        ]
          .filter(Boolean)
          .join(" ");

        if (isNonJobTitle(title)) continue;
        if (!isUsText(location)) continue;
        if (!isEngineeringText(searchText)) continue;
        if (isInternshipText(searchText)) continue;

        const applyUrl = new URL(
          `/job/${normalizedJobTitleKey(title)}/${recordString(job, [
            "guid",
            "reqid",
            "id",
          ])}/job/`,
          source.sourceUrl ?? companyWebsite ?? `https://${origin}`,
        ).toString();

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

          employmentType: normalizeEmploymentType(
            recordString(job, ["job_type"]),
          ),
          workMode: detectWorkMode(`${title} ${remoteType}`, location),

          salaryMin: salary.min,
          salaryMax: salary.max,
          salaryCurrency: "USD",

          skills: [],
          responsibilities: splitListItems(description, 12),
          requirements: splitListItems(description, 14),
          benefits: [],

          status: "published",

          postedAt:
            isoDateFromText(recordString(job, ["date_new", "date_updated"])) ??
            new Date().toISOString(),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId,
          applyUrl,

          experienceLevel: null,
          category,

          companyTagline: null,
          companySize: null,
          companyWebsite,
        });
      }

      if (!data.pagination?.has_more_pages) break;
    }
  }

  return jobs;
}
