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
  includesAnyTerm,
  isNonJobTitle,
  isoDateFromText,
  metadataNumber,
  metadataString,
  metadataStringArray,
  numberRangeFromText,
  splitListItems,
  uniqueItems,
} from "./shared";

export type CoveoResult = {
  title?: string;
  raw?: Record<string, unknown>;
};

export type CoveoResponse = {
  results?: CoveoResult[];
  totalCount?: number;
};

export const COVEO_DEFAULT_PAGE_SIZE = 25;

export const COVEO_DEFAULT_MAX_PAGES = 4;

export function coveoString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => coveoString(item))
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

export function coveoTimestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  return isoDateFromText(coveoString(value)) ?? new Date().toISOString();
}

export function coveoSearchEndpoint(
  source: JobSource,
  html: string,
): { organizationId: string; token: string; searchUrl: string } {
  const configuredOrganizationId = metadataString(source, "organizationId");
  const configuredSearchUrl =
    metadataString(source, "searchUrl") ??
    "https://platform.cloud.coveo.com/rest/search/v2";
  const literalMatch = html.match(
    /Coveo\.SearchEndpoint\.configureCloudV2Endpoint\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/i,
  );
  const variableMatch = html.match(
    /Coveo\.SearchEndpoint\.configureCloudV2Endpoint\(\s*[^,]+,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/i,
  );
  const organizationMatch = html.match(
    /var\s+organizationID\s*=\s*['"]([^'"]+)['"]/i,
  );

  const organizationId =
    configuredOrganizationId ?? literalMatch?.[1] ?? organizationMatch?.[1];
  const token =
    metadataString(source, "token") ?? literalMatch?.[2] ?? variableMatch?.[1];
  const searchUrl =
    metadataString(source, "searchUrl") ??
    literalMatch?.[3] ??
    variableMatch?.[2] ??
    configuredSearchUrl;

  if (!organizationId || !token) {
    throw new Error(
      `Coveo source ${source.companyName} is missing organization/token metadata`,
    );
  }

  return { organizationId, token, searchUrl };
}

export async function fetchCoveoJobs(
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
    throw new Error(`Coveo source ${source.companyName} is missing source_url`);
  }

  const pageResponse = await fetch(source.sourceUrl, {
    headers: {
      Accept: "text/html",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
    signal: context?.signal,
  });

  if (!pageResponse.ok) {
    throw new Error(`Coveo source page fetch failed: ${pageResponse.status}`);
  }

  const { organizationId, token, searchUrl } = coveoSearchEndpoint(
    source,
    await pageResponse.text(),
  );
  const searchTerms = uniqueItems(
    metadataStringArray(source, "searchTerms") ?? [
      "software engineer",
      "data engineer",
      "security engineer",
    ],
  );
  const requiredTerms = metadataStringArray(source, "requiredTerms") ?? [];
  const titleTerms = metadataStringArray(source, "titleTerms") ?? [];
  const excludedTitleTerms =
    metadataStringArray(source, "excludedTitleTerms") ?? [];
  const pageSize = Math.max(
    metadataNumber(source, "pageSize") ?? COVEO_DEFAULT_PAGE_SIZE,
    1,
  );
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? COVEO_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const searchHub = metadataString(source, "searchHub") ?? "Search";
  const publicBase =
    metadataString(source, "publicBase") ??
    (source.companyDomain
      ? `https://www.${source.companyDomain}`
      : source.sourceUrl);
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const query of searchTerms) {
    for (let page = 0; page < maxPages; page += 1) {
      const url = new URL(searchUrl);
      url.searchParams.set("organizationId", organizationId);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "HireGeneralJobBoard/1.0",
        },
        body: JSON.stringify({
          q: query,
          numberOfResults: pageSize,
          firstResult: page * pageSize,
          searchHub,
        }),
        cache: "no-store",
        signal: context?.signal,
      });

      if (!response.ok) {
        throw new Error(`Coveo search failed: ${response.status}`);
      }

      const data = (await response.json()) as CoveoResponse;
      const pageJobs = data.results ?? [];
      if (pageJobs.length === 0) break;

      for (const result of pageJobs) {
        const raw = result.raw ?? {};
        const title = coveoString(raw.mrc_title) || result.title?.trim() || "";
        if (!title) continue;

        const sourceId = `${source.sourceSlug}:${
          coveoString(raw.mrc_articleid) ||
          coveoString(raw.jobviteid) ||
          coveoString(raw.permanentid) ||
          normalizedJobTitleKey(title)
        }`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const location =
          coveoString(raw.mrc_joblocation) ||
          coveoString(raw.mrc_joblocations) ||
          "United States";
        const description = safeDescription({
          description: coveoString(raw.mrc_summary),
          title,
          companyName: source.companyName,
        });
        const jobType = coveoString(raw.mrc_jobtype);
        const searchText = [
          title,
          description,
          jobType,
          coveoString(raw.mrc_industrytype),
          category,
        ]
          .filter(Boolean)
          .join(" ");

        if (isNonJobTitle(title)) continue;
        if (!isUsText(location)) continue;
        if (!isEngineeringText(searchText)) continue;
        if (
          requiredTerms.length > 0 &&
          !includesAnyTerm(searchText, requiredTerms)
        )
          continue;
        if (titleTerms.length > 0 && !includesAnyTerm(title, titleTerms))
          continue;
        if (
          excludedTitleTerms.length > 0 &&
          includesAnyTerm(title, excludedTitleTerms)
        )
          continue;
        if (isInternshipText(searchText)) continue;

        const applyUrl = new URL(
          coveoString(raw.mrc_url) ||
            coveoString(raw.clickableuri) ||
            coveoString(raw.uri) ||
            source.sourceUrl,
          publicBase,
        ).toString();
        const salary = numberRangeFromText(coveoString(raw.mrc_salaryrange));

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

          employmentType: normalizeEmploymentType(jobType),
          workMode: detectWorkMode(title, location),

          salaryMin: salary.min,
          salaryMax: salary.max,
          salaryCurrency: "USD",

          skills: [],
          responsibilities: splitListItems(description, 12),
          requirements: splitListItems(description, 14),
          benefits: [],

          status: "published",

          postedAt: coveoTimestamp(raw.mrc_publishdate ?? raw.date),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId,
          applyUrl,

          experienceLevel: coveoString(raw.mrc_experiencelevel) || null,
          category,

          companyTagline: null,
          companySize: null,
          companyWebsite,
        });
      }

      if (pageJobs.length < pageSize) break;
    }
  }

  return jobs;
}
