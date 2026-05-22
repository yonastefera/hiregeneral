import {
  defaultExpiryDate,
  detectWorkMode,
  normalizeEmploymentType,
  safeDescription,
  type ImportedJob,
} from "./normalize";
import { isEngineeringText, isInternshipText, isUsText } from "./filters";
import type { JobSource } from "./job-sources";
import type { JobSourceAdapter } from "./source";

type PhenomConfig = {
  widgetApiEndpoint: string;
  refNum: string;
  locale: string;
  country: string;
  pageName: string;
  siteType: string;
  baseUrl: string;
  searchTerms: string[];
  selectedFields: Record<string, string[]>;
  pageSize: number;
  maxPages: number;
  preferPublicJobUrl: boolean;
};

type PhenomJob = {
  applyUrl?: string;
  category?: string;
  city?: string;
  country?: string;
  dateCreated?: string;
  department?: string;
  descriptionTeaser?: string;
  jobId?: string;
  jobSeqNo?: string;
  location?: string;
  ml_job_parser?: {
    descriptionTeaser?: string;
    descriptionTeaser_ats?: string;
    descriptionTeaser_first200?: string;
    descriptionTeaser_keyword?: string;
  };
  ml_skills?: string[];
  multi_category?: string[];
  multi_location?: string[];
  multi_location_array?: Array<{
    location?: string;
    latlong?: {
      lat?: number | string;
      lon?: number | string;
    };
  }>;
  postedDate?: string;
  reqId?: string;
  state?: string;
  title?: string;
  type?: string;
};

type PhenomRefineSearchResponse = {
  refineSearch?: {
    status?: number;
    hits?: number;
    totalHits?: number;
    data?: {
      jobs?: PhenomJob[];
    };
  };
};

const DEFAULT_SEARCH_TERMS = [
  "software",
  "developer",
  "engineer",
  "technology",
];

function metadataString(source: JobSource, key: string) {
  const value = source.metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataNumber(source: JobSource, key: string) {
  const value = source.metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metadataBoolean(source: JobSource, key: string) {
  const value = source.metadata[key];
  return typeof value === "boolean" ? value : false;
}

function metadataStringArray(source: JobSource, key: string) {
  const value = source.metadata[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : null;
}

function metadataSelectedFields(source: JobSource) {
  const value = source.metadata.selectedFields;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, fieldValue]) => {
      if (!Array.isArray(fieldValue)) return [];

      const values = fieldValue.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      );

      return values.length > 0 ? [[key, values]] : [];
    }),
  );
}

function phenomConfig(source: JobSource): PhenomConfig {
  const widgetApiEndpoint = metadataString(source, "widgetApiEndpoint");
  const refNum = metadataString(source, "refNum");
  const baseUrl = metadataString(source, "baseUrl") ?? source.sourceUrl ?? "";

  if (!widgetApiEndpoint || !refNum) {
    throw new Error(
      `Phenom source ${source.companyName} is missing widgetApiEndpoint/refNum metadata`,
    );
  }

  return {
    widgetApiEndpoint,
    refNum,
    baseUrl: baseUrl.replace(/\/$/, ""),
    locale: metadataString(source, "locale") ?? "en_us",
    country: metadataString(source, "country") ?? "us",
    pageName: metadataString(source, "pageName") ?? "search-results",
    siteType: metadataString(source, "siteType") ?? "external",
    searchTerms:
      metadataStringArray(source, "searchTerms") ?? DEFAULT_SEARCH_TERMS,
    selectedFields: metadataSelectedFields(source),
    pageSize: Math.min(
      Math.max(metadataNumber(source, "pageSize") ?? 25, 1),
      100,
    ),
    maxPages: Math.min(
      Math.max(metadataNumber(source, "maxPages") ?? 4, 1),
      20,
    ),
    preferPublicJobUrl: metadataBoolean(source, "preferPublicJobUrl"),
  };
}

function compact(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function unique(items: string[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const value = compact(item);
    const key = value.toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function locations(job: PhenomJob) {
  return unique(
    [
      ...(job.multi_location ?? []),
      ...(job.multi_location_array ?? []).map((location) => location.location),
      job.location,
      [job.city, job.state, job.country].filter(Boolean).join(", "),
    ].filter((value): value is string => Boolean(value)),
  );
}

function searchableRoleText(job: PhenomJob) {
  return [
    job.title,
    job.department,
    job.category,
    ...(job.multi_category ?? []),
    ...(job.ml_skills ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function searchableDescription(job: PhenomJob) {
  return compact(
    job.ml_job_parser?.descriptionTeaser_ats ??
      job.ml_job_parser?.descriptionTeaser_keyword ??
      job.ml_job_parser?.descriptionTeaser ??
      job.descriptionTeaser,
  );
}

function searchableLocationText(job: PhenomJob) {
  return [...locations(job), job.country].filter(Boolean).join(" ");
}

function sourceId(sourceSlug: string, job: PhenomJob) {
  const id =
    job.jobSeqNo ?? job.jobId ?? job.reqId ?? job.applyUrl ?? job.title;

  return `${sourceSlug}:${compact(id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;
}

function postedAt(job: PhenomJob) {
  const value = job.postedDate ?? job.dateCreated;

  if (!value) return new Date().toISOString();

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function publicJobUrl(config: PhenomConfig, job: PhenomJob) {
  const id = job.jobSeqNo ?? job.jobId ?? job.reqId;

  if (!id) return config.baseUrl;

  const slug = compact(job.title)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return [config.baseUrl, "job", encodeURIComponent(id), slug]
    .filter(Boolean)
    .join("/");
}

function applyUrl(config: PhenomConfig, job: PhenomJob) {
  if (config.preferPublicJobUrl) return publicJobUrl(config, job);

  if (job.applyUrl) return job.applyUrl;

  return publicJobUrl(config, job);
}

async function fetchSearchPage(params: {
  config: PhenomConfig;
  from: number;
  keyword: string;
  signal?: AbortSignal;
}) {
  const { config, from, keyword, signal } = params;

  const response = await fetch(config.widgetApiEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    body: JSON.stringify({
      ddoKey: "refineSearch",
      sortBy: "",
      subsearch: "",
      from,
      jobs: true,
      counts: true,
      all_fields: [
        "category",
        "country",
        "state",
        "city",
        "type",
        "department",
      ],
      size: config.pageSize,
      clearAll: false,
      jdsource: "facets",
      isSliderEnable: false,
      pageName: config.pageName,
      siteType: config.siteType,
      keywords: keyword,
      global: true,
      selected_fields: config.selectedFields,
      lang: config.locale,
      deviceType: "desktop",
      country: config.country,
      refNum: config.refNum,
    }),
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Phenom search failed: ${response.status}`);
  }

  const data = (await response.json()) as PhenomRefineSearchResponse;
  const result = data.refineSearch;

  if (!result || result.status !== 200 || !Array.isArray(result.data?.jobs)) {
    throw new Error("Invalid Phenom search response");
  }

  return {
    jobs: result.data.jobs,
    totalHits: result.totalHits ?? result.data.jobs.length,
  };
}

export async function fetchPhenomJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const config = phenomConfig(source);
  const jobsById = new Map<string, PhenomJob>();

  for (const keyword of config.searchTerms) {
    for (let page = 0; page < config.maxPages; page += 1) {
      const from = page * config.pageSize;
      const result = await fetchSearchPage({
        config,
        from,
        keyword,
        signal: context?.signal,
      });

      result.jobs.forEach((job) => {
        jobsById.set(sourceId(source.sourceSlug, job), job);
      });

      if (
        result.jobs.length < config.pageSize ||
        from + config.pageSize >= result.totalHits
      ) {
        break;
      }
    }
  }

  return [...jobsById.entries()]
    .map(([id, job]) => ({
      id,
      job,
      title: compact(job.title),
      description: searchableDescription(job),
      location: locations(job).join(", ") || "United States",
    }))
    .filter(({ title }) => title)
    .filter(({ job, location }) =>
      isUsText(`${location} ${searchableLocationText(job)}`),
    )
    .filter(({ job, description, title }) =>
      isEngineeringText(`${title} ${searchableRoleText(job)} ${description}`),
    )
    .filter(
      ({ job, description, title }) =>
        !isInternshipText(`${title} ${searchableRoleText(job)} ${description}`),
    )
    .map(({ description, id, job, location, title }) => ({
      recruiterId,

      companyId: null,
      companyName: source.companyName,
      companyLogoUrl: source.companyLogoUrl ?? null,

      title,
      description: safeDescription({
        description,
        title,
        companyName: source.companyName,
      }),
      location,

      latitude: null,
      longitude: null,

      employmentType: normalizeEmploymentType(job.type),
      workMode: detectWorkMode(title, location),

      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",

      skills: unique(job.ml_skills ?? []).slice(0, 8),
      responsibilities: [],
      requirements: [],
      benefits: [],

      status: "published",

      postedAt: postedAt(job),
      expiresAt: defaultExpiryDate(30),

      sourceName: "phenom",
      sourceId: id,
      applyUrl: applyUrl(config, job),

      experienceLevel: null,
      category:
        job.department ?? job.category ?? job.multi_category?.[0] ?? null,

      companyTagline: null,
      companySize: null,
      companyWebsite: source.companyDomain
        ? `https://${source.companyDomain}`
        : null,
    }));
}

export const phenomAdapter: JobSourceAdapter = {
  type: "phenom",
  fetchJobs: fetchPhenomJobs,
};
