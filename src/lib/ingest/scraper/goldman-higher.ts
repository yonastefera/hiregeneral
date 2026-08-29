import {
  defaultExpiryDate,
  detectWorkMode,
  normalizeEmploymentType,
  safeDescription,
} from "../normalize";
import type { ImportedJob } from "../normalize";
import { isEngineeringText, isInternshipText, isUsText } from "../filters";
import type { JobSource } from "../job-sources";
import { metadataNumber, metadataString, metadataStringArray } from "./shared";

export type GoldmanHigherRole = {
  roleId?: string;
  corporateTitle?: string | null;
  division?: string | null;
  jobTitle?: string;
  jobFunction?: string | null;
  locations?: Array<{
    primary?: boolean;
    state?: string | null;
    country?: string | null;
    city?: string | null;
  }>;
  status?: string;
  skills?: string[];
  jobType?: {
    code?: string | null;
    description?: string | null;
  } | null;
  externalSource?: {
    sourceId?: string | null;
  } | null;
};

export type GoldmanHigherResponse = {
  data?: {
    roleSearch?: {
      totalCount?: number;
      items?: GoldmanHigherRole[];
    };
  };
};

export const GOLDMAN_HIGHER_DEFAULT_API_URL =
  "https://api-higher.gs.com/gateway/api/v1/graphql";

export const GOLDMAN_HIGHER_DEFAULT_PAGE_SIZE = 20;

export const GOLDMAN_HIGHER_DEFAULT_MAX_PAGES = 4;

export function goldmanHigherLocation(job: GoldmanHigherRole) {
  const location =
    job.locations?.find((item) => item.primary) ?? job.locations?.[0];

  return [location?.city, location?.state, location?.country]
    .filter(Boolean)
    .join(", ");
}

export function goldmanHigherLocationSearchText(job: GoldmanHigherRole) {
  return (job.locations ?? [])
    .map((location) =>
      [location.city, location.state, location.country]
        .filter(Boolean)
        .join(", "),
    )
    .join(" ");
}

export function goldmanHigherApplyUrl(
  source: JobSource,
  role: GoldmanHigherRole,
) {
  const publicBase =
    metadataString(source, "publicBase") ??
    source.sourceUrl ??
    "https://higher.gs.com";
  const sourceId = role.externalSource?.sourceId ?? role.roleId;

  return sourceId
    ? new URL(`/roles/${sourceId}`, publicBase).toString()
    : publicBase;
}

export async function fetchGoldmanHigherJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const apiUrl =
    metadataString(source, "apiUrl") ?? GOLDMAN_HIGHER_DEFAULT_API_URL;
  const pageSize = Math.max(
    metadataNumber(source, "pageSize") ?? GOLDMAN_HIGHER_DEFAULT_PAGE_SIZE,
    1,
  );
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? GOLDMAN_HIGHER_DEFAULT_MAX_PAGES,
    1,
  );
  const searchTerms = metadataStringArray(source, "searchTerms") ?? [
    "software",
    "technology",
    "engineering",
    "data",
    "security",
  ];
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();
  const query = `
    query GetRoles($searchQueryInput: RoleSearchQueryInput!) {
      roleSearch(searchQueryInput: $searchQueryInput) {
        totalCount
        items {
          roleId
          corporateTitle
          jobTitle
          jobFunction
          locations {
            primary
            state
            country
            city
          }
          status
          division
          skills
          jobType {
            code
            description
          }
          externalSource {
            sourceId
          }
        }
      }
    }
  `;

  for (const searchTerm of searchTerms) {
    for (let page = 0; page < maxPages; page += 1) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "HireGeneralJobBoard/1.0",
          "x-higher-session-id": `hiregeneral-${source.sourceSlug}`,
        },
        body: JSON.stringify({
          query,
          variables: {
            searchQueryInput: {
              page: {
                pageSize,
                pageNumber: page,
              },
              filters: [],
              experiences: ["PROFESSIONAL", "EARLY_CAREER"],
              searchTerm,
            },
          },
        }),
        cache: "no-store",
        signal: context?.signal,
      });

      if (!response.ok) {
        throw new Error(`Goldman Higher fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as GoldmanHigherResponse;
      const pageJobs = data.data?.roleSearch?.items ?? [];

      if (pageJobs.length === 0) break;

      for (const job of pageJobs) {
        if (job.status && job.status !== "POSTED") continue;

        const title = job.jobTitle?.trim();
        if (!title) continue;

        const externalSourceId = job.externalSource?.sourceId ?? job.roleId;
        const sourceId = `${source.sourceSlug}:${externalSourceId ?? title}`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const location = goldmanHigherLocation(job);
        const locationSearchText = goldmanHigherLocationSearchText(job);
        const searchText = [
          title,
          job.jobFunction,
          job.division,
          job.corporateTitle,
          ...(job.skills ?? []),
          category,
        ]
          .filter(Boolean)
          .join(" ");

        if (!isUsText(locationSearchText || location)) continue;
        if (!isEngineeringText(searchText)) continue;
        if (isInternshipText(searchText)) continue;

        const description = safeDescription({
          description: [
            title,
            job.jobFunction,
            job.division,
            job.corporateTitle,
            ...(job.skills ?? []),
          ]
            .filter(Boolean)
            .join(". "),
          title,
          companyName: source.companyName,
        });

        const importedJob: ImportedJob = {
          recruiterId,
          companyId: null,
          companyName: source.companyName,
          companyLogoUrl: source.companyLogoUrl ?? null,

          title,
          description,
          location: location || "United States",

          latitude: null,
          longitude: null,

          employmentType: normalizeEmploymentType(job.jobType?.description),
          workMode: detectWorkMode(title, location),

          salaryMin: null,
          salaryMax: null,
          salaryCurrency: "USD",

          skills: job.skills ?? [],
          responsibilities: [],
          requirements: [],
          benefits: [],

          status: "published",

          postedAt: new Date().toISOString(),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId,
          applyUrl: goldmanHigherApplyUrl(source, job),

          experienceLevel: null,
          category: job.jobFunction ?? category,

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
