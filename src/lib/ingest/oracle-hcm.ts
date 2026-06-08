import {
  defaultExpiryDate,
  detectWorkMode,
  htmlToText,
  normalizeEmploymentType,
  safeDescription,
  type ImportedJob,
} from "./normalize";
import { isEngineeringText, isInternshipText, isUsText } from "./filters";
import { sanitizeJobPostingHtml } from "@/lib/text/html";
import type { JobSource } from "./job-sources";
import type { JobSourceAdapter } from "./source";

const PAGE_SIZE = 50;
const MAX_PAGES = 10;

type OracleRequisition = {
  Category?: string | null;
  CorporateDescriptionStr?: string | null;
  Id?: string | number;
  Title?: string;
  ExternalDescriptionStr?: string | null;
  PostedDate?: string;
  PostingEndDate?: string | null;
  PrimaryLocation?: string;
  PrimaryLocationCountry?: string;
  ShortDescriptionStr?: string | null;
  ExternalQualificationsStr?: string | null;
  ExternalResponsibilitiesStr?: string | null;
  JobFamily?: string | null;
  JobFunction?: string | null;
  OrganizationDescriptionStr?: string | null;
  WorkerType?: string | null;
  ContractType?: string | null;
  JobSchedule?: string | null;
  WorkplaceType?: string | null;
  WorkplaceTypeCode?: string | null;
  workLocation?: Array<{
    Name?: string;
  }>;
  otherWorkLocations?: Array<{
    Name?: string;
  }>;
};

type OracleSearchItem = {
  TotalJobsCount?: number;
  requisitionList?: OracleRequisition[];
};

type OracleSearchResponse = {
  items?: OracleSearchItem[];
};

type OracleDetailResponse = {
  items?: OracleRequisition[];
};

type OracleHcmConfig = {
  apiBase: string;
  publicBase: string;
  siteNumber: string;
  searchTexts: string[];
  selectedCategoriesFacet: string | null;
  selectedLocationsFacet: string | null;
  countryCode: string | null;
  pageSize: number;
  maxPages: number;
};

function metadataString(source: JobSource, key: string) {
  const value = source.metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataNumber(source: JobSource, key: string) {
  const value = source.metadata[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function metadataStringArray(source: JobSource, key: string) {
  const value = source.metadata[key];

  if (!Array.isArray(value)) return null;

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function oracleHcmConfig(source: JobSource): OracleHcmConfig {
  const sourceUrl = source.sourceUrl ? new URL(source.sourceUrl) : null;
  const apiBase =
    metadataString(source, "apiBase") ??
    (sourceUrl ? `${sourceUrl.origin}/hcmRestApi/resources/11.13.18.05` : null);
  const publicBase =
    metadataString(source, "publicBase") ??
    source.sourceUrl?.replace(/\/$/, "") ??
    null;
  const siteNumber = metadataString(source, "siteNumber") ?? source.sourceSlug;

  if (!apiBase || !publicBase || !siteNumber) {
    throw new Error(
      `Oracle HCM source ${source.companyName} is missing apiBase/publicBase/siteNumber metadata`,
    );
  }

  return {
    apiBase: apiBase.replace(/\/$/, ""),
    publicBase: publicBase.replace(/\/$/, ""),
    siteNumber,
    searchTexts: metadataStringArray(source, "searchTexts") ?? [
      metadataString(source, "searchText") ?? "technology",
      "data",
      "analytics",
      "data science",
      "data engineering",
      "data governance",
    ],
    selectedCategoriesFacet: metadataString(source, "selectedCategoriesFacet"),
    selectedLocationsFacet: metadataString(source, "selectedLocationsFacet"),
    countryCode: metadataString(source, "countryCode") ?? "US",
    pageSize: Math.min(
      Math.max(metadataNumber(source, "pageSize") ?? PAGE_SIZE, 1),
      100,
    ),
    maxPages: Math.min(
      Math.max(metadataNumber(source, "maxPages") ?? MAX_PAGES, 1),
      40,
    ),
  };
}

function finderValue(value: string) {
  return value.replace(/[,;]/g, " ");
}

function searchUrl(
  config: OracleHcmConfig,
  searchText: string,
  offset: number,
) {
  const finderParts = [
    `siteNumber=${finderValue(config.siteNumber)}`,
    `keyword=${finderValue(searchText)}`,
    `limit=${config.pageSize}`,
    `offset=${offset}`,
    "sortBy=POSTING_DATES_DESC",
  ];

  if (config.selectedLocationsFacet) {
    finderParts.push(
      `selectedLocationsFacet=${finderValue(config.selectedLocationsFacet)}`,
    );
  }

  if (config.selectedCategoriesFacet) {
    finderParts.push(
      `selectedCategoriesFacet=${finderValue(config.selectedCategoriesFacet)}`,
    );
  }

  if (config.countryCode) {
    finderParts.push(
      `workLocationCountryCode=${finderValue(config.countryCode)}`,
    );
  }

  const url = new URL(`${config.apiBase}/recruitingCEJobRequisitions`);
  url.searchParams.set("onlyData", "true");
  url.searchParams.set("totalResults", "true");
  url.searchParams.set("expand", "requisitionList");
  url.searchParams.set("finder", `findReqs;${finderParts.join(",")}`);

  return url;
}

async function fetchOracleSearchPage(
  config: OracleHcmConfig,
  searchText: string,
  offset: number,
  signal?: AbortSignal,
) {
  const response = await fetch(searchUrl(config, searchText, offset), {
    headers: {
      Accept: "application/json",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
    signal,
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `Oracle HCM search failed: ${response.status} ${body.slice(0, 300)}`,
    );
  }

  try {
    return JSON.parse(body) as OracleSearchResponse;
  } catch {
    throw new Error(
      `Oracle HCM search returned non-JSON response: ${body.slice(0, 300)}`,
    );
  }
}

function postedAt(value: string | undefined) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function isoDateOrNull(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function requisitionLocations(requisition: OracleRequisition) {
  const locations = [
    requisition.PrimaryLocation,
    ...(requisition.workLocation ?? []).map((location) => location.Name),
    ...(requisition.otherWorkLocations ?? []).map((location) => location.Name),
  ]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(/\s*;\s*/))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(locations)];
}

function searchableText(requisition: OracleRequisition) {
  return [
    requisition.Title,
    requisition.JobFamily,
    requisition.JobFunction,
    requisition.ShortDescriptionStr,
    requisition.ExternalQualificationsStr,
    requisition.ExternalResponsibilitiesStr,
  ]
    .filter(Boolean)
    .join(" ");
}

function isUsRequisition(requisition: OracleRequisition) {
  if (requisition.PrimaryLocationCountry === "US") return true;

  return isUsText(requisitionLocations(requisition).join(" "));
}

function detailsUrl(config: OracleHcmConfig, requisition: OracleRequisition) {
  return `${config.publicBase}/job/${encodeURIComponent(String(requisition.Id))}`;
}

function detailUrl(config: OracleHcmConfig, requisitionId: string | number) {
  const url = new URL(`${config.apiBase}/recruitingCEJobRequisitionDetails`);
  url.searchParams.set("expand", "all");
  url.searchParams.set("onlyData", "true");
  url.searchParams.set(
    "finder",
    `ById;Id="${finderValue(String(requisitionId))}",siteNumber=${finderValue(
      config.siteNumber,
    )}`,
  );

  return url;
}

async function fetchOracleDetail(
  config: OracleHcmConfig,
  requisition: OracleRequisition,
  signal?: AbortSignal,
) {
  if (!requisition.Id) return requisition;

  const response = await fetch(detailUrl(config, requisition.Id), {
    headers: {
      Accept: "application/json",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
    signal,
  });

  if (!response.ok) return requisition;

  try {
    const body = (await response.json()) as OracleDetailResponse;
    const detail = body.items?.[0];

    return detail ? { ...requisition, ...detail } : requisition;
  } catch {
    return requisition;
  }
}

async function fetchOracleRequisitions(
  config: OracleHcmConfig,
  signal?: AbortSignal,
) {
  const requisitionsById = new Map<string, OracleRequisition>();

  for (const searchText of config.searchTexts) {
    for (let page = 0; page < config.maxPages; page += 1) {
      const offset = page * config.pageSize;
      const response = await fetchOracleSearchPage(
        config,
        searchText,
        offset,
        signal,
      );
      const searchItem = response.items?.[0];
      const pageRequisitions = searchItem?.requisitionList ?? [];

      for (const requisition of pageRequisitions) {
        if (requisition.Id) {
          requisitionsById.set(String(requisition.Id), requisition);
        }
      }

      if (pageRequisitions.length < config.pageSize) break;
    }
  }

  return [...requisitionsById.values()];
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

function oracleDescriptionHtml(requisition: OracleRequisition) {
  return sanitizeJobPostingHtml(
    [
      requisition.ExternalDescriptionStr,
      requisition.ExternalResponsibilitiesStr,
      requisition.ExternalQualificationsStr,
      requisition.OrganizationDescriptionStr,
      requisition.CorporateDescriptionStr,
      requisition.ShortDescriptionStr,
    ]
      .filter(Boolean)
      .join("\n\n"),
  );
}

export async function fetchOracleHcmJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const config = oracleHcmConfig(source);
  const requisitions = await fetchOracleRequisitions(config, context?.signal);
  const detailedRequisitions = await mapWithConcurrency(
    requisitions,
    4,
    (requisition) => fetchOracleDetail(config, requisition, context?.signal),
  );

  return detailedRequisitions
    .filter((requisition) => requisition.Id && requisition.Title)
    .filter(isUsRequisition)
    .filter((requisition) => isEngineeringText(searchableText(requisition)))
    .filter((requisition) => !isInternshipText(searchableText(requisition)))
    .map((requisition) => {
      const title = String(requisition.Title).replace(/\s+/g, " ").trim();
      const descriptionHtml = oracleDescriptionHtml(requisition);
      const description = htmlToText(descriptionHtml);
      const location = requisitionLocations(requisition).join(", ");

      return {
        recruiterId,
        companyId: null,
        companyName: source.companyName,
        companyLogoUrl: source.companyLogoUrl ?? null,

        title,
        description:
          descriptionHtml ||
          safeDescription({
            description,
            title,
            companyName: source.companyName,
          }),
        location: location || "United States",

        latitude: null,
        longitude: null,

        employmentType: normalizeEmploymentType(
          requisition.JobSchedule ??
            requisition.WorkerType ??
            requisition.ContractType ??
            null,
        ),
        workMode: detectWorkMode(
          title,
          `${location} ${requisition.WorkplaceType ?? ""} ${
            requisition.WorkplaceTypeCode ?? ""
          }`,
        ),

        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: [],
        requirements: [],
        benefits: [],

        status: "published",

        postedAt: postedAt(requisition.PostedDate),
        expiresAt:
          isoDateOrNull(requisition.PostingEndDate) ?? defaultExpiryDate(30),

        sourceName: "oracle_hcm",
        sourceId: `${source.sourceSlug}:${requisition.Id}`,
        applyUrl: detailsUrl(config, requisition),

        experienceLevel: null,
        category:
          requisition.Category ??
          requisition.JobFamily ??
          requisition.JobFunction ??
          null,

        companyTagline: null,
        companySize: null,
        companyWebsite: source.companyDomain
          ? `https://${source.companyDomain}`
          : null,
      };
    });
}

export const oracleHcmAdapter: JobSourceAdapter = {
  type: "oracle_hcm",
  fetchJobs: fetchOracleHcmJobs,
};
