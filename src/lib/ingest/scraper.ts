import {
  defaultExpiryDate,
  detectWorkMode,
  htmlToText,
  normalizeEmploymentType,
  safeDescription,
  type ImportedJob,
} from "./normalize";
import {
  isEngineeringText,
  isInternshipText,
  isUsText,
  normalizedJobTitleKey,
} from "./filters";
import type { JobSource } from "./job-sources";
import type { JobSourceAdapter } from "./source";

type PlayrixJob = {
  id?: number | string;
  name?: string;
  code?: string;
  previewText?: string;
  dateUpdate?: string;
  isHidden?: boolean;
  titleMsg?: string;
  responsibilities?: string;
  requirements?: string;
  ourStack?: string;
  roleAbout?: string;
  preferred?: string;
  weOffer?: string;
  detailText?: string;
  workFormat?: string;
};

type PlayrixResponse = {
  success?: boolean;
  items?: PlayrixJob[];
};

type MCloudJob = {
  id?: number | string;
  ref?: string;
  clientid?: string;
  title?: string;
  description?: string;
  primary_city?: string;
  primary_state?: string;
  primary_country?: string;
  primary_address?: string;
  addtnl_locations?: unknown[];
  job_type?: string;
  employment_type?: string;
  schedule?: string;
  location_type?: string;
  primary_category?: string;
  parent_category?: string;
  function?: string;
  recruiter?: string;
  level?: string;
  salary?: string;
  open_date?: string;
  update_date?: string;
  url?: string;
  seo_url?: string;
  hidden?: string | boolean;
  is_posted?: string | boolean;
};

type MCloudResponse = {
  totalHits?: number;
  queryResult?: MCloudJob[];
};

type EightfoldJob = Record<string, unknown>;

type EightfoldResponse =
  | EightfoldJob[]
  | {
      positions?: EightfoldJob[];
      jobs?: EightfoldJob[];
      results?: EightfoldJob[];
      count?: number;
      total?: number;
      total_count?: number;
      data?:
        | EightfoldJob[]
        | {
            positions?: EightfoldJob[];
            jobs?: EightfoldJob[];
            results?: EightfoldJob[];
            count?: number;
            total?: number;
            total_count?: number;
          };
    };

type ActivateSearchResponse = {
  jobsHtml?: string;
  paginationHtml?: string;
  hasResults?: boolean;
};

type ActivateSearchJob = {
  detailUrl: string;
  location: string;
  locationSearchText: string;
  sourceId: string;
  title: string;
};

type ActivateJobPostingSchema = {
  "@type"?: string;
  title?: string;
  description?: string;
  employmentType?: string;
  datePosted?: string;
  industry?: string;
  jobLocation?: unknown;
};

type TargetJobDocument = {
  applyurl?: string;
  basepaymax?: number | string;
  basepaymin?: number | string;
  city?: string;
  companyName?: string;
  country?: string;
  dateposted?: string;
  hasmultiplelocations?: boolean | string;
  hierarchy?: string;
  jobcategories?: string;
  jobfamily?: string;
  jobskills?: string | string[];
  latitude?: number | string;
  locationcount?: number | string;
  longitude?: number | string;
  nodeguid?: string;
  organization?: string;
  postingid?: string;
  primarycategory?: string;
  requisitionid?: string;
  scheduletype?: string;
  state?: string;
  title?: string;
  url?: string;
  workersubtype?: string;
};

type TargetJobSearchResponse = {
  count?: number;
  results?: Array<{
    document?: TargetJobDocument;
  }>;
};

type WalmartJob = {
  id?: string;
  text?: string;
  metadata?: Record<string, unknown>;
};

type WalmartSearchResponse = {
  jobs?: WalmartJob[];
  totalJobs?: number;
};

type YahooCareerJobFields = {
  ApplyLink?: string;
  Brand?: string;
  JobCategory?: string;
  JobDescription?: string;
  JobLevel?: string;
  JobTitle?: string;
  OtherLocations?: string;
  PostingDate?: string;
  PrimaryLocation?: string;
  ReqNo?: string;
  documentid?: string;
  message?: string;
};

type YahooCareerSearchResult = {
  fields?: YahooCareerJobFields;
};

type YahooCareerSearchResponse =
  | YahooCareerSearchResult[]
  | {
      TotalResultCount?: number;
      data?: YahooCareerSearchResult[];
    };

type TalentBrewSearchJob = {
  applyUrl: string;
  dateText: string;
  location: string;
  sourceId: string;
  title: string;
};

const PLAYRIX_DEFAULT_API_URL =
  "https://playrix.com/api/v1/index.php?action=job/getList";
const AVATURE_DEFAULT_PAGE_SIZE = 10;
const AVATURE_DEFAULT_MAX_PAGES = 4;
const MCLOUD_DEFAULT_API_BASE = "https://jobsapi-internal.m-cloud.io/api";
const MCLOUD_DEFAULT_PAGE_SIZE = 50;
const MCLOUD_DEFAULT_MAX_PAGES = 4;
const ACTIVATE_DEFAULT_PAGE_SIZE = 12;
const ACTIVATE_DEFAULT_MAX_PAGES = 5;
const EIGHTFOLD_DEFAULT_PAGE_SIZE = 10;
const EIGHTFOLD_DEFAULT_MAX_PAGES = 10;
const TARGET_DEFAULT_API_URL = "https://corporate.target.com/api/jobsearch";
const TARGET_DEFAULT_MAX_PAGES = 6;
const WALMART_DEFAULT_API_URL =
  "https://careers.walmart.com/api/ai/search-ai/api/v1/combined/hybrid-search";
const WALMART_DEFAULT_PAGE_SIZE = 25;
const WALMART_DEFAULT_MAX_PAGES = 4;
const YAHOO_DEFAULT_API_URL =
  "https://www.yahooinc.com/careers/calls/makeVespaCalls.php";
const YAHOO_DEFAULT_PAGE_SIZE = 20;
const YAHOO_DEFAULT_MAX_PAGES = 5;
const TALENTBREW_DEFAULT_ORG_ID = "185";
const TALENTBREW_DEFAULT_MAX_PAGES = 6;

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

function uniqueItems(items: string[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function normalizeLine(value: string) {
  return value
    .replace(/^[•·\-\u2013\u2014\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitListItems(value: string | null | undefined, maxItems: number) {
  return uniqueItems(
    htmlToText(value)
      .split(/\n+/)
      .map(normalizeLine)
      .filter((line) => line.length >= 10),
  ).slice(0, maxItems);
}

function firstRecordString(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return "";

  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function recordString(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return "";

  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function recordNumber(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return null;

  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 10)),
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function playrixPostedAt(value: string | null | undefined) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value.replace(" ", "T"));

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function playrixApplyUrl(publicBase: string, job: PlayrixJob) {
  if (job.code) {
    return `${publicBase.replace(/\/$/, "")}/job/open/${job.code}`;
  }

  return `${publicBase.replace(/\/$/, "")}/job/open`;
}

function playrixSourceId(sourceSlug: string, job: PlayrixJob) {
  const normalizedTitle = normalizedJobTitleKey(job.name ?? "").replace(
    /\s+/g,
    "-",
  );

  if (normalizedTitle) return `${sourceSlug}:role:${normalizedTitle}`;

  return `${sourceSlug}:${job.code ?? job.id ?? "unknown"}`;
}

function playrixDescription(job: PlayrixJob) {
  return [
    job.roleAbout,
    job.detailText,
    job.responsibilities,
    job.requirements,
    job.ourStack,
    job.preferred,
    job.weOffer,
    job.previewText,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function playrixSearchText(job: PlayrixJob) {
  return [
    job.name,
    job.titleMsg,
    job.previewText,
    job.roleAbout,
    job.detailText,
    job.responsibilities,
    job.requirements,
    job.ourStack,
    job.preferred,
  ]
    .filter(Boolean)
    .join(" ");
}

async function fetchPlayrixJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const apiUrl = metadataString(source, "apiUrl") ?? PLAYRIX_DEFAULT_API_URL;
  const publicBase =
    metadataString(source, "publicBase") ?? "https://playrix.com";
  const defaultLocation = metadataString(source, "defaultLocation") ?? "Remote";

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
    signal: context?.signal,
  });

  if (!response.ok) {
    throw new Error(`Playrix fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as PlayrixResponse;

  if (!data.success || !Array.isArray(data.items)) {
    throw new Error("Invalid Playrix careers response");
  }

  return data.items
    .filter((job) => {
      if (job.isHidden) return false;

      const text = playrixSearchText(job);
      return isEngineeringText(text) && !isInternshipText(text);
    })
    .map((job): ImportedJob => {
      const title = job.name?.trim() || "Software role";
      const location = defaultLocation;
      const description = playrixDescription(job);

      return {
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

        employmentType: normalizeEmploymentType(job.workFormat),
        workMode: detectWorkMode(`${title} ${job.workFormat ?? ""}`, location),

        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",

        skills: splitListItems(job.ourStack, 12),
        responsibilities: splitListItems(job.responsibilities, 12),
        requirements: splitListItems(
          [job.requirements, job.preferred].filter(Boolean).join("\n"),
          14,
        ),
        benefits: splitListItems(job.weOffer, 10),

        status: "published",

        postedAt: playrixPostedAt(job.dateUpdate),
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId: playrixSourceId(source.sourceSlug, job),
        applyUrl: playrixApplyUrl(publicBase, job),

        experienceLevel: null,
        category: "Game technology",

        companyTagline: null,
        companySize: null,
        companyWebsite: source.companyDomain
          ? `https://${source.companyDomain}`
          : publicBase,
      };
    });
}

function avatureClassText(article: string, className: string) {
  const match = article.match(
    new RegExp(`<span class=["']${className}["']>([\\s\\S]*?)<\\/span>`, "i"),
  );

  return match ? htmlToText(decodeHtml(match[1])).trim() : "";
}

function avaturePostedAt(value: string) {
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

function avaturePageUrl(source: JobSource, pageSize: number, offset: number) {
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

function parseAvatureArticle(source: JobSource, article: string) {
  const linkMatch = article.match(
    /<a class=["']link["'] href=["']([^"']+)["']>([\s\S]*?)<\/a>/i,
  );

  if (!linkMatch) return null;

  const [, href, titleHtml] = linkMatch;
  const title = htmlToText(decodeHtml(titleHtml)).replace(/\s+/g, " ").trim();
  const sourceUrl = source.sourceUrl ?? "https://smurfitwestrockta.avature.net";
  const applyUrl = new URL(decodeHtml(href), sourceUrl).toString();
  const location = avatureClassText(article, "list-item-location");
  const employmentType = avatureClassText(article, "list-item-type");
  const postedText = avatureClassText(article, "list-item-posted");
  const jobId = avatureClassText(article, "list-item-ref").replace(
    /^Job ID:\s*/i,
    "",
  );

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

function parseAvatureJobs(source: JobSource, html: string) {
  return [
    ...html.matchAll(
      /<article\b[^>]*class=["'][^"']*\barticle--result\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi,
    ),
  ]
    .map((match) => parseAvatureArticle(source, match[1]))
    .filter((job): job is NonNullable<typeof job> => Boolean(job));
}

async function fetchAvatureJobs(
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

      const searchText = `${job.title} ${job.location} ${category}`;
      if (!isUsText(job.location)) continue;
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
        location: job.location || "United States",

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

function mcloudJobsUrl(source: JobSource, pageSize: number, offset: number) {
  const apiBase = metadataString(source, "apiBase") ?? MCLOUD_DEFAULT_API_BASE;
  const url = new URL("job", `${apiBase.replace(/\/$/, "")}/`);
  const organization =
    metadataString(source, "organization") ??
    metadataString(source, "smartPostOrg") ??
    metadataString(source, "orgId");
  const facets = metadataStringArray(source, "facets") ?? [];

  if (!organization) {
    throw new Error(
      `M-Cloud source ${source.companyName} is missing organization metadata`,
    );
  }

  url.searchParams.set("Organization", organization);
  url.searchParams.set("Limit", String(pageSize));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sortfield", "open_date");
  url.searchParams.set("sortorder", "descending");
  url.searchParams.set("useBooleanKeywordSearch", "true");

  for (const facet of facets) {
    url.searchParams.append("facet", facet);
  }

  return url;
}

function mcloudLocation(job: MCloudJob) {
  if (
    String(job.location_type ?? "")
      .toLowerCase()
      .includes("remote")
  ) {
    if (job.primary_city && job.primary_state) {
      return `Remote - ${job.primary_city}, ${job.primary_state}`;
    }

    return "Remote - United States";
  }

  const primary = [job.primary_city, job.primary_state]
    .filter(Boolean)
    .join(", ");

  if (primary) return primary;
  if (job.primary_country === "US") return "United States";

  return [job.primary_address, job.primary_country].filter(Boolean).join(", ");
}

function mcloudLocationSearchText(job: MCloudJob) {
  const addtnlLocations = Array.isArray(job.addtnl_locations)
    ? job.addtnl_locations
        .map((location) =>
          [
            firstRecordString(location, ["city", "primary_city", "name"]),
            firstRecordString(location, ["state", "primary_state"]),
            firstRecordString(location, ["country", "primary_country"]),
          ]
            .filter(Boolean)
            .join(", "),
        )
        .join(" ")
    : "";

  return [
    job.primary_city,
    job.primary_state,
    job.primary_country,
    job.primary_address,
    job.location_type,
    addtnlLocations,
  ]
    .filter(Boolean)
    .join(" ");
}

function mcloudPostedAt(job: MCloudJob) {
  const parsed = new Date(job.open_date ?? job.update_date ?? "");

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function mcloudSalary(value: string | null | undefined) {
  const matches = [...(value ?? "").matchAll(/\$?([\d,]+)(?:\.\d{2})?/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  if (matches.length === 0) return { min: null, max: null };

  const [min, max] = [Math.min(...matches), Math.max(...matches)];
  return { min, max: max === min ? null : max };
}

function mcloudSourceId(source: JobSource, job: MCloudJob) {
  return `${source.sourceSlug}:${job.ref ?? job.clientid ?? job.id ?? job.url}`;
}

function mcloudApplyUrl(job: MCloudJob, fallback: string) {
  return job.url ?? job.seo_url ?? fallback;
}

async function fetchMCloudJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const pageSize = Math.max(
    metadataNumber(source, "pageSize") ?? MCLOUD_DEFAULT_PAGE_SIZE,
    1,
  );
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? MCLOUD_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 0; page < maxPages; page += 1) {
    const offset = page * pageSize + 1;
    const response = await fetch(mcloudJobsUrl(source, pageSize, offset), {
      headers: {
        Accept: "application/json",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`M-Cloud fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as MCloudResponse;
    const pageJobs = Array.isArray(data.queryResult) ? data.queryResult : [];

    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      if (job.hidden === true || job.hidden === "true") continue;
      if (job.is_posted === false || job.is_posted === "false") continue;

      const title = job.title?.trim();
      const applyUrl = mcloudApplyUrl(
        job,
        source.sourceUrl ?? companyWebsite ?? "https://careers.homedepot.com",
      );
      if (!title || !applyUrl) continue;

      const sourceId = mcloudSourceId(source, job);
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const description = safeDescription({
        description: job.description,
        title,
        companyName: source.companyName,
      });
      const location = mcloudLocation(job);
      const searchText = [
        title,
        description,
        job.primary_category,
        job.parent_category,
        job.function,
        job.recruiter,
        category,
      ]
        .filter(Boolean)
        .join(" ");

      if (!isUsText(mcloudLocationSearchText(job))) continue;
      if (!isEngineeringText(searchText)) continue;
      if (isInternshipText(searchText)) continue;

      const salary = mcloudSalary(`${job.level ?? ""} ${job.salary ?? ""}`);

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
          job.employment_type || job.job_type || job.schedule,
        ),
        workMode: detectWorkMode(
          title,
          `${location} ${job.location_type ?? ""}`,
        ),

        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: splitListItems(job.description, 12),
        requirements: splitListItems(job.description, 14),
        benefits: [],

        status: "published",

        postedAt: mcloudPostedAt(job),
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId,
        applyUrl,

        experienceLevel: null,
        category: job.primary_category ?? category,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }

    if (pageJobs.length < pageSize || jobs.length >= (data.totalHits ?? 0)) {
      break;
    }
  }

  return jobs;
}

function activateSearchUrl(
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

function activateClassDd(html: string, className: string) {
  const match = html.match(
    new RegExp(
      `<div[^>]+class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>[\\s\\S]*?<dd>([\\s\\S]*?)<\\/dd>`,
      "i",
    ),
  );

  return match?.[1] ?? "";
}

function activateSpans(html: string) {
  return uniqueItems(
    [...html.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)]
      .map((match) => htmlToText(decodeHtml(match[1])).trim())
      .filter(Boolean),
  );
}

function parseActivateSearchJobs(source: JobSource, html: string) {
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

function activateJobPostingSchema(html: string) {
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

function activateSchemaLocations(schema: ActivateJobPostingSchema | null) {
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

function activateApplyUrl(html: string, fallback: string) {
  const match = html.match(
    /<a\b(?=[^>]*\bapply-external\b)[^>]*href=["']([^"']+)["'][^>]*>/i,
  );

  return match?.[1] ? decodeHtml(match[1]) : fallback;
}

function activatePostedAt(value: string | null | undefined) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function activateLocationLabel(locations: string[], fallback: string) {
  if (locations.length === 0) return fallback || "United States";

  const [first] = locations;
  const hiddenCount = locations.length - 1;

  return hiddenCount > 0 ? `${first}, ${hiddenCount} locations` : first;
}

async function fetchActivateJobs(
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
        });
      }

      if (pageJobs.length < pageSize) break;
    }
  }

  return jobs;
}

function eightfoldJobsUrl(source: JobSource, start: number) {
  const apiBase =
    metadataString(source, "apiBase") ??
    source.sourceUrl ??
    "https://morganstanley.eightfold.ai";
  const domain =
    metadataString(source, "domain") ??
    source.companyDomain ??
    new URL(apiBase).hostname;
  const searchText = metadataString(source, "searchText") ?? "technology";
  const location = metadataString(source, "location") ?? "United States";
  const sortBy = metadataString(source, "sortBy");
  const url = new URL("/api/pcsx/search", apiBase);

  url.searchParams.set("domain", domain);
  url.searchParams.set("query", searchText);
  url.searchParams.set("location", location);
  url.searchParams.set("start", String(start));
  if (sortBy) url.searchParams.set("sort_by", sortBy);

  return url;
}

function eightfoldJobDetailsUrl(source: JobSource, job: EightfoldJob) {
  const apiBase =
    metadataString(source, "apiBase") ??
    source.sourceUrl ??
    "https://morganstanley.eightfold.ai";
  const domain =
    metadataString(source, "domain") ??
    source.companyDomain ??
    new URL(apiBase).hostname;
  const location = metadataString(source, "location") ?? "United States";
  const positionId = recordString(job, [
    "id",
    "position_id",
    "positionId",
    "pid",
    "job_id",
    "jobId",
  ]);

  if (!positionId) return null;

  const url = new URL("/api/pcsx/position_details", apiBase);
  url.searchParams.set("position_id", positionId);
  url.searchParams.set("domain", domain);
  url.searchParams.set("queried_location", location);

  return url;
}

function splitSetCookieHeader(value: string) {
  return value.split(/,(?=\s*[^;,=]+=[^;,]+)/g);
}

function responseCookies(headers: Headers) {
  const maybeGetSetCookie = (
    headers as Headers & {
      getSetCookie?: () => string[];
    }
  ).getSetCookie?.();
  const setCookies =
    maybeGetSetCookie && maybeGetSetCookie.length > 0
      ? maybeGetSetCookie
      : splitSetCookieHeader(headers.get("set-cookie") ?? "");

  return setCookies
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

function htmlCsrfToken(html: string) {
  const match = html.match(
    /<meta\s+name=["']_csrf["']\s+content=["']([^"']+)["']/i,
  );

  return match?.[1] ?? "";
}

async function eightfoldSessionHeaders(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
) {
  const pageUrl =
    source.sourceUrl ??
    metadataString(source, "apiBase") ??
    "https://morganstanley.eightfold.ai/careers";
  const response = await fetch(pageUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
    signal: context?.signal,
  });
  const html = await response.text();

  if (!response.ok) {
    throw new Error(`Eightfold session fetch failed: ${response.status}`);
  }

  const csrfToken = response.headers.get("x-csrf-token") ?? htmlCsrfToken(html);
  const cookie = responseCookies(response.headers);
  const headers: Record<string, string> = {
    Accept: "application/json",
    Referer: pageUrl,
    "User-Agent": "HireGeneralJobBoard/1.0",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;
  if (cookie) headers.Cookie = cookie;

  return headers;
}

function eightfoldJobsFromResponse(data: EightfoldResponse) {
  if (Array.isArray(data)) return data;

  const direct = [data.positions, data.jobs, data.results].find(Array.isArray);
  if (direct) return direct;

  if (Array.isArray(data.data)) return data.data;

  const nested = data.data;
  if (nested && typeof nested === "object") {
    return (
      [nested.positions, nested.jobs, nested.results].find(Array.isArray) ?? []
    );
  }

  return [];
}

function eightfoldTotalFromResponse(data: EightfoldResponse) {
  if (Array.isArray(data)) return null;

  const direct = data.total ?? data.total_count ?? data.count;
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;

  const nested = data.data;
  if (!nested || Array.isArray(nested) || typeof nested !== "object") {
    return null;
  }

  const nestedTotal = nested.total ?? nested.total_count ?? nested.count;
  return typeof nestedTotal === "number" && Number.isFinite(nestedTotal)
    ? nestedTotal
    : null;
}

function eightfoldLocation(job: EightfoldJob) {
  const direct = recordString(job, [
    "location",
    "location_name",
    "locationName",
    "full_location",
    "fullLocation",
    "display_location",
    "displayLocation",
    "primary_location",
    "primaryLocation",
    "position_profile_locations",
  ]);

  if (direct) return direct;

  const locations =
    (Array.isArray(job.locations) && job.locations) ||
    (Array.isArray(job.standardizedLocations) && job.standardizedLocations) ||
    (Array.isArray(job.standardized_locations) && job.standardized_locations) ||
    (Array.isArray(job.position_profile_locations) &&
      job.position_profile_locations) ||
    (Array.isArray(job.location_list) && job.location_list);
  if (Array.isArray(locations)) {
    const parsedLocations = locations
      .map((location) => {
        if (typeof location === "string") return location.trim();

        return [
          recordString(location, ["city", "city_name", "name"]),
          recordString(location, ["state", "state_name", "region"]),
          recordString(location, ["country", "country_name"]),
        ]
          .filter(Boolean)
          .join(", ");
      })
      .filter(Boolean);

    if (parsedLocations.length > 0) {
      const first = parsedLocations[0];
      const hiddenCount = parsedLocations.length - 1;
      return hiddenCount > 0 ? `${first}, ${hiddenCount} locations` : first;
    }
  }

  const cityState = [
    recordString(job, ["city"]),
    recordString(job, ["state", "region"]),
  ]
    .filter(Boolean)
    .join(", ");

  return cityState || recordString(job, ["country"]) || "United States";
}

function eightfoldLocationSearchText(job: EightfoldJob) {
  const locationText = [eightfoldLocation(job)];
  const locations =
    (Array.isArray(job.locations) && job.locations) ||
    (Array.isArray(job.standardizedLocations) && job.standardizedLocations) ||
    (Array.isArray(job.standardized_locations) && job.standardized_locations) ||
    (Array.isArray(job.position_profile_locations) &&
      job.position_profile_locations) ||
    (Array.isArray(job.location_list) && job.location_list);

  if (Array.isArray(locations)) {
    locationText.push(
      ...locations.map((location) =>
        typeof location === "string"
          ? location
          : [
              recordString(location, ["city", "city_name", "name"]),
              recordString(location, ["state", "state_name", "region"]),
              recordString(location, ["country", "country_name"]),
            ]
              .filter(Boolean)
              .join(" "),
      ),
    );
  }

  return locationText.filter(Boolean).join(" ");
}

function eightfoldDescription(job: EightfoldJob) {
  return recordString(job, [
    "description",
    "job_description",
    "jobDescription",
    "display_description",
    "displayDescription",
    "short_description",
    "shortDescription",
    "summary",
  ]);
}

function eightfoldPostedAt(job: EightfoldJob) {
  const dateText = recordString(job, [
    "posted_at",
    "postedAt",
    "posted_date",
    "postedDate",
    "date_posted",
    "datePosted",
    "created_at",
    "updated_at",
  ]);

  if (dateText) {
    const parsed = new Date(dateText);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  const timestamp = recordNumber(job, [
    "posted_ts",
    "postedTs",
    "created_ts",
    "updated_ts",
    "t_create",
    "t_update",
  ]);

  if (timestamp) {
    const millis = timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000;
    const parsed = new Date(millis);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return new Date().toISOString();
}

function eightfoldApplyUrl(source: JobSource, job: EightfoldJob) {
  const baseUrl =
    metadataString(source, "apiBase") ??
    source.sourceUrl ??
    "https://morganstanley.eightfold.ai";
  const directUrl = recordString(job, [
    "apply_url",
    "applyUrl",
    "canonical_url",
    "canonicalUrl",
    "position_url",
    "positionUrl",
    "url",
  ]);

  if (directUrl) {
    return new URL(directUrl, baseUrl).toString();
  }

  const userActions = job.positionUserActions;
  const applyAction =
    userActions && typeof userActions === "object"
      ? (userActions as Record<string, unknown>).applyAction
      : null;
  const nestedApplyUrl =
    applyAction && typeof applyAction === "object"
      ? recordString(applyAction, ["applyUrl", "apply_url", "url"])
      : "";

  if (nestedApplyUrl) {
    return new URL(nestedApplyUrl, baseUrl).toString();
  }

  const positionId = recordString(job, [
    "id",
    "position_id",
    "positionId",
    "pid",
    "job_id",
    "jobId",
    "req_id",
    "requisition_id",
  ]);

  if (positionId) {
    return new URL(
      `/careers/job/${encodeURIComponent(positionId)}`,
      baseUrl,
    ).toString();
  }

  return source.sourceUrl ?? "https://morganstanley.eightfold.ai/careers";
}

function eightfoldSourceId(source: JobSource, job: EightfoldJob) {
  const id = recordString(job, [
    "id",
    "position_id",
    "positionId",
    "pid",
    "job_id",
    "jobId",
    "req_id",
    "requisition_id",
    "display_job_id",
    "displayJobId",
    "atsJobId",
  ]);

  if (id) return `${source.sourceSlug}:${id}`;

  const title = recordString(job, ["title", "name", "position_name"]);
  return `${source.sourceSlug}:${normalizedJobTitleKey(title)}`;
}

async function fetchEightfoldJobDetails(
  source: JobSource,
  job: EightfoldJob,
  headers: Record<string, string>,
  context?: {
    signal?: AbortSignal;
  },
) {
  const url = eightfoldJobDetailsUrl(source, job);
  if (!url) return job;

  const response = await fetch(url, {
    headers,
    cache: "no-store",
    signal: context?.signal,
  });

  if (!response.ok) return job;

  const data = (await response.json()) as {
    data?: EightfoldJob;
  };

  if (!data.data || typeof data.data !== "object") return job;

  return {
    ...job,
    ...data.data,
  };
}

async function fetchEightfoldJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const pageSize = Math.min(
    Math.max(
      metadataNumber(source, "pageSize") ?? EIGHTFOLD_DEFAULT_PAGE_SIZE,
      1,
    ),
    EIGHTFOLD_DEFAULT_PAGE_SIZE,
  );
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? EIGHTFOLD_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();
  const sessionHeaders = await eightfoldSessionHeaders(source, context);

  for (let page = 0; page < maxPages; page += 1) {
    const start = page * pageSize;
    const response = await fetch(eightfoldJobsUrl(source, start), {
      headers: sessionHeaders,
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`Eightfold fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as EightfoldResponse;
    const pageJobs = eightfoldJobsFromResponse(data);
    const total = eightfoldTotalFromResponse(data);

    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      const title = recordString(job, ["title", "name", "position_name"]);
      if (!title) continue;

      const sourceId = eightfoldSourceId(source, job);
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const location = eightfoldLocation(job);
      const description = safeDescription({
        description: eightfoldDescription(job),
        title,
        companyName: source.companyName,
      });
      const searchText = [
        title,
        description,
        category,
        recordString(job, [
          "department",
          "team",
          "job_category",
          "job_function",
          "businessarea",
        ]),
      ]
        .filter(Boolean)
        .join(" ");

      if (!isUsText(eightfoldLocationSearchText(job))) continue;
      if (!isEngineeringText(searchText)) continue;
      if (isInternshipText(searchText)) continue;

      const detailedJob = await fetchEightfoldJobDetails(
        source,
        job,
        sessionHeaders,
        context,
      );
      const detailedDescription = safeDescription({
        description: eightfoldDescription(detailedJob),
        title,
        companyName: source.companyName,
      });

      jobs.push({
        recruiterId,
        companyId: null,
        companyName: source.companyName,
        companyLogoUrl: source.companyLogoUrl ?? null,

        title,
        description: detailedDescription,
        location,

        latitude: null,
        longitude: null,

        employmentType: normalizeEmploymentType(
          recordString(detailedJob, [
            "employment_type",
            "employmentType",
            "job_type",
            "efcustom_text_text_time_type",
            "efcustomTextTextTimeType",
          ]),
        ),
        workMode: detectWorkMode(title, location),

        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: splitListItems(detailedDescription, 12),
        requirements: splitListItems(detailedDescription, 14),
        benefits: [],

        status: "published",

        postedAt: eightfoldPostedAt(job),
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId,
        applyUrl: eightfoldApplyUrl(source, detailedJob),

        experienceLevel: null,
        category,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }

    if (
      pageJobs.length < pageSize ||
      (total !== null && jobs.length >= total)
    ) {
      break;
    }
  }

  return jobs;
}

function targetSearchBody(
  source: JobSource,
  page: number,
  query: string,
): URLSearchParams {
  const params = new URLSearchParams();

  params.set("currentPage", String(page));
  params.set("q", query);
  params.set("hierarchy", metadataString(source, "hierarchy") ?? "Corporate");
  params.set("remotetype", "");
  params.set("jobcategories", metadataString(source, "jobCategory") ?? "");
  params.set("workersubtype", "");
  params.set("scheduletype", "");
  params.set("basepayfrequency", "");
  params.set("organization", "");
  params.set("locationname", "");
  params.set("jobaddress", "");
  params.set("profiles", "");
  params.set("city", "");
  params.set("state", "");
  params.set("country", "");
  params.set("internshipType", "");
  params.set("jobfamily", "");
  params.set("subFamilies", "");
  params.set("culture", "");
  params.set("filtercondition", "");
  params.set("compgrade", "");

  return params;
}

function targetPublicUrl(source: JobSource, job: TargetJobDocument) {
  const publicBase =
    metadataString(source, "publicBase") ?? "https://corporate.target.com";

  if (job.url?.startsWith("http")) return job.url;
  if (job.url) return new URL(job.url, publicBase).toString();

  return source.sourceUrl || publicBase;
}

function targetLocation(job: TargetJobDocument) {
  const location = uniqueItems(
    [job.city, job.state, job.country].filter(
      (value): value is string => typeof value === "string" && Boolean(value),
    ),
  ).join(", ");

  if (location) return location;

  return job.hasmultiplelocations || job.locationcount
    ? "United States, multiple locations"
    : "United States";
}

function targetSkills(job: TargetJobDocument) {
  if (Array.isArray(job.jobskills)) {
    return uniqueItems(
      job.jobskills
        .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
        .filter(Boolean),
    ).slice(0, 14);
  }

  return splitListItems(job.jobskills, 14);
}

function targetDescription(job: TargetJobDocument, title: string) {
  const skills = targetSkills(job);
  return safeDescription({
    title,
    companyName: "Target",
    description: [
      `${title} role at Target.`,
      job.jobfamily ? `Job family: ${job.jobfamily}.` : "",
      job.primarycategory ? `Category: ${job.primarycategory}.` : "",
      skills.length ? `Skills: ${skills.join(", ")}.` : "",
      "Visit Target careers for the complete role description and application details.",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

function targetPostedAt(value: string | null | undefined) {
  if (!value) return new Date().toISOString();

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

async function fetchTargetJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const apiUrl = metadataString(source, "apiUrl") ?? TARGET_DEFAULT_API_URL;
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? TARGET_DEFAULT_MAX_PAGES,
    1,
  );
  const searchTerms = metadataStringArray(source, "searchTerms") ?? [
    "software",
    "engineer",
    "developer",
    "technology",
  ];
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const searchTerm of searchTerms) {
    for (let page = 1; page <= maxPages; page += 1) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "HireGeneralJobBoard/1.0",
        },
        body: targetSearchBody(source, page, searchTerm).toString(),
        cache: "no-store",
        signal: context?.signal,
      });

      if (!response.ok) {
        throw new Error(`Target careers fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as TargetJobSearchResponse;
      const pageJobs = Array.isArray(data.results)
        ? data.results
            .map((item) => item.document)
            .filter((item): item is TargetJobDocument => Boolean(item))
        : [];

      if (pageJobs.length === 0) break;

      for (const job of pageJobs) {
        const title = job.title?.trim();
        if (!title) continue;

        const sourceId = `${source.sourceSlug}:${
          job.requisitionid ?? job.postingid ?? job.nodeguid ?? job.url ?? title
        }`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const location = targetLocation(job);
        const description = targetDescription(job, title);
        const searchText = [
          title,
          description,
          job.jobfamily,
          job.primarycategory,
          job.jobcategories,
          targetSkills(job).join(" "),
        ]
          .filter(Boolean)
          .join(" ");

        if (!isUsText(`${location} ${job.country ?? ""}`)) continue;
        if (!isEngineeringText(searchText)) continue;
        if (isInternshipText(searchText)) continue;

        const applyUrl =
          typeof job.applyurl === "string" && job.applyurl.startsWith("http")
            ? job.applyurl
            : targetPublicUrl(source, job);

        jobs.push({
          recruiterId,
          companyId: null,
          companyName: source.companyName,
          companyLogoUrl: source.companyLogoUrl ?? null,

          title,
          description,
          location,

          latitude: recordNumber(job, ["latitude"]),
          longitude: recordNumber(job, ["longitude"]),

          employmentType: normalizeEmploymentType(
            job.scheduletype ?? job.workersubtype,
          ),
          workMode: detectWorkMode(title, location),

          salaryMin: recordNumber(job, ["basepaymin"]),
          salaryMax: recordNumber(job, ["basepaymax"]),
          salaryCurrency: "USD",

          skills: targetSkills(job),
          responsibilities: splitListItems(description, 12),
          requirements: [],
          benefits: [],

          status: "published",

          postedAt: targetPostedAt(job.dateposted),
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
    }
  }

  return jobs;
}

function walmartTextField(text: string | null | undefined, label: string) {
  if (!text) return "";

  const pattern = new RegExp(
    `${label}:\\s*([\\s\\S]*?)(?:\\n[A-Z][^\\n]{1,60}:|$)`,
  );
  return text.match(pattern)?.[1]?.trim() ?? "";
}

function walmartMetadataArray(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];
  if (!Array.isArray(value)) return [];

  return uniqueItems(
    value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean),
  );
}

function walmartLocation(metadata: Record<string, unknown> | undefined) {
  const payRange = metadata?.payRange;
  if (Array.isArray(payRange)) {
    const locations = payRange
      .map((item) => recordString(item, ["location"]))
      .filter(Boolean);
    if (locations.length) return uniqueItems(locations).slice(0, 3).join(", ");
  }

  const city = recordString(metadata, ["primaryLocationCity"]);
  const state = recordString(metadata, ["primaryLocationState"]);
  const country = recordString(metadata, ["primaryLocationCountry"]);

  return (
    uniqueItems([city, state, country].filter(Boolean)).join(", ") ||
    "United States"
  );
}

function walmartPostedAt(metadata: Record<string, unknown> | undefined) {
  const timestamp = recordNumber(metadata, ["jobPostingStartDate"]);
  if (timestamp) {
    const date = new Date(timestamp);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  return new Date().toISOString();
}

function walmartDescription(job: WalmartJob, title: string) {
  const text = htmlToText(job.text);
  const summary = walmartTextField(text, "Job Summary");
  const description = walmartTextField(text, "Job Posting Description");

  return safeDescription({
    title,
    companyName: "Walmart",
    description: [summary, description || text].filter(Boolean).join("\n\n"),
  });
}

function walmartApplyUrl(source: JobSource, job: WalmartJob) {
  const publicBase =
    metadataString(source, "publicBase") ?? "https://careers.walmart.com";
  const id = job.metadata ? recordString(job.metadata, ["jobId"]) : job.id;
  const externalId = job.id ?? id;

  if (!externalId) return source.sourceUrl || publicBase;

  return new URL(
    `/us/en/jobs/${encodeURIComponent(externalId)}`,
    publicBase,
  ).toString();
}

async function fetchWalmartJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const apiUrl = metadataString(source, "apiUrl") ?? WALMART_DEFAULT_API_URL;
  const pageSize = Math.min(
    Math.max(
      metadataNumber(source, "pageSize") ?? WALMART_DEFAULT_PAGE_SIZE,
      1,
    ),
    50,
  );
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? WALMART_DEFAULT_MAX_PAGES,
    1,
  );
  const locale = metadataString(source, "locale") ?? "en_US";
  const lang = metadataString(source, "lang") ?? "en";
  const searchTerms = metadataStringArray(source, "searchTerms") ?? [
    "software",
    "engineer",
    "developer",
    "technology",
  ];
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const searchTerm of searchTerms) {
    for (let page = 0; page < maxPages; page += 1) {
      const url = new URL(apiUrl);
      url.searchParams.set("page", String(page));
      url.searchParams.set("size", String(pageSize));
      url.searchParams.set("locale", locale);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "HireGeneralJobBoard/1.0",
        },
        body: JSON.stringify({
          query: searchTerm,
          directSearch: true,
          isReset: page === 0,
          lang,
        }),
        cache: "no-store",
        signal: context?.signal,
      });

      if (!response.ok) {
        throw new Error(`Walmart careers fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as WalmartSearchResponse;
      const pageJobs = Array.isArray(data.jobs) ? data.jobs : [];

      if (pageJobs.length === 0) break;

      for (const job of pageJobs) {
        const metadata = job.metadata;
        const title =
          recordString(metadata, ["title", "jobPostingTitle"]) ||
          walmartTextField(job.text, "Job Posting Title");
        if (!title) continue;

        const sourceId = `${source.sourceSlug}:${
          recordString(metadata, ["jobId"]) || job.id || title
        }`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const location = walmartLocation(metadata);
        const description = walmartDescription(job, title);
        const skills = walmartMetadataArray(metadata, "skills").slice(0, 16);
        const searchText = [
          title,
          description,
          walmartMetadataArray(metadata, "areas").join(" "),
          walmartMetadataArray(metadata, "categories").join(" "),
          walmartMetadataArray(metadata, "jobFamilyId").join(" "),
          skills.join(" "),
        ]
          .filter(Boolean)
          .join(" ");

        if (recordString(metadata, ["primaryLocationCountry"]) !== "US")
          continue;
        if (recordString(metadata, ["brand"]).toLowerCase() !== "walmart")
          continue;
        if (!isEngineeringText(searchText)) continue;
        if (isInternshipText(searchText)) continue;

        jobs.push({
          recruiterId,
          companyId: null,
          companyName: source.companyName,
          companyLogoUrl: source.companyLogoUrl ?? null,

          title,
          description,
          location,

          latitude: recordNumber(metadata, ["latitudeDgr"]),
          longitude: recordNumber(metadata, ["longitudeDgr"]),

          employmentType: normalizeEmploymentType(
            recordString(metadata, ["timeType"]),
          ),
          workMode: detectWorkMode(title, location),

          salaryMin: recordNumber(metadata, ["minPay"]),
          salaryMax: recordNumber(metadata, ["maxPay"]),
          salaryCurrency: recordString(metadata, ["currencyCode"]) || "USD",

          skills,
          responsibilities: splitListItems(description, 12),
          requirements: splitListItems(description, 14),
          benefits: [],

          status: "published",

          postedAt: walmartPostedAt(metadata),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId,
          applyUrl: walmartApplyUrl(source, job),

          experienceLevel: null,
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

function yahooPageJobs(data: YahooCareerSearchResponse) {
  return (Array.isArray(data) ? data : (data.data ?? [])).filter(
    (item): item is YahooCareerSearchResult =>
      Boolean(item.fields && !item.fields.message),
  );
}

function yahooLocation(fields: YahooCareerJobFields) {
  const locations = uniqueItems(
    [fields.PrimaryLocation, fields.OtherLocations]
      .filter((item): item is string => Boolean(item?.trim()))
      .flatMap((item) =>
        item.split(
          /,\s*(?=[A-Z][a-z]+ - |US - |United|India|Canada|France|Germany|Ireland|Israel|Norway|Taiwan)/,
        ),
      ),
  );

  return locations.slice(0, 3).join(", ") || "United States";
}

function yahooPostedAt(value: string | null | undefined) {
  const parsed = new Date(value ?? "");

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

async function fetchYahooJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const apiUrl = metadataString(source, "apiUrl") ?? YAHOO_DEFAULT_API_URL;
  const searchTerms = metadataStringArray(source, "searchTerms") ?? [
    "software",
    "engineer",
    "developer",
    "technology",
  ];
  const jobCategories = metadataStringArray(source, "jobCategories") ?? [
    "Software Development",
    "Engineering",
    "Information Systems",
  ];
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? YAHOO_DEFAULT_MAX_PAGES,
    1,
  );
  const pageSize = Math.max(
    metadataNumber(source, "pageSize") ?? YAHOO_DEFAULT_PAGE_SIZE,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const searchTerm of searchTerms) {
    for (let page = 0; page < maxPages; page += 1) {
      const body = new URLSearchParams({
        searchContent: searchTerm.replace(/\s+/g, "-"),
        action: "searchJobs",
        job_cats: jobCategories.join(","),
        job_brands: "",
        job_locations: "",
        job_levels: "",
        offset: String(page * pageSize),
        check: metadataString(source, "check") ?? "1",
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "HireGeneralJobBoard/1.0",
        },
        body,
        cache: "no-store",
        signal: context?.signal,
      });

      if (!response.ok) {
        throw new Error(`Yahoo careers fetch failed: ${response.status}`);
      }

      const text = await response.text();
      const data = JSON.parse(text) as YahooCareerSearchResponse;
      const pageJobs = yahooPageJobs(data);

      if (pageJobs.length === 0) break;

      for (const item of pageJobs) {
        const fields = item.fields;
        const title = fields?.JobTitle?.replace(/<\/?[^>]+>/g, "").trim();
        const applyUrl = fields?.ApplyLink?.trim();

        if (!fields || !title || !applyUrl) continue;

        const sourceId = `${source.sourceSlug}:${
          fields.ReqNo ?? fields.documentid ?? applyUrl
        }`;
        if (seenSourceIds.has(sourceId)) continue;
        seenSourceIds.add(sourceId);

        const location = yahooLocation(fields);
        const description = safeDescription({
          description: fields.JobDescription,
          title,
          companyName: source.companyName,
        });
        const searchText = [
          title,
          description,
          fields.Brand,
          fields.JobCategory,
          fields.JobLevel,
        ]
          .filter(Boolean)
          .join(" ");

        if (!isUsText(location)) continue;
        if (!isEngineeringText(searchText)) continue;
        if (isInternshipText(searchText)) continue;

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

          employmentType: normalizeEmploymentType("Full-time"),
          workMode: detectWorkMode(title, `${location} ${description}`),

          salaryMin: null,
          salaryMax: null,
          salaryCurrency: "USD",

          skills: [],
          responsibilities: splitListItems(fields.JobDescription, 12),
          requirements: splitListItems(fields.JobDescription, 14),
          benefits: [],

          status: "published",

          postedAt: yahooPostedAt(fields.PostingDate),
          expiresAt: defaultExpiryDate(30),

          sourceName: "scraper",
          sourceId,
          applyUrl,

          experienceLevel: fields.JobLevel ?? null,
          category: fields.JobCategory ?? category,

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

function talentBrewSearchUrl(
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

function talentBrewPostedAt(value: string) {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function talentBrewResults(html: string, publicBase: string) {
  return [
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
}

async function fetchTalentBrewJobs(
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

        const searchText = `${job.title} ${job.location} ${searchTerm}`;
        if (!isUsText(job.location)) continue;
        if (!isEngineeringText(searchText)) continue;
        if (isInternshipText(searchText)) continue;

        const description = safeDescription({
          title: job.title,
          companyName: source.companyName,
          description: `${job.title} role at ${source.companyName}. Visit the company careers site for the complete description and application details.`,
        });

        jobs.push({
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
          category,

          companyTagline: null,
          companySize: null,
          companyWebsite,
        });
      }

      if (pageJobs.length < 15) break;
    }
  }

  return jobs;
}

export const scraperAdapter: JobSourceAdapter = {
  type: "scraper",
  fetchJobs: (source, context) => {
    const adapter =
      metadataString(source, "adapter") ?? metadataString(source, "scraper");

    if (adapter === "playrix") {
      return fetchPlayrixJobs(source, context);
    }

    if (adapter === "avature") {
      return fetchAvatureJobs(source, context);
    }

    if (adapter === "mcloud") {
      return fetchMCloudJobs(source, context);
    }

    if (adapter === "activate") {
      return fetchActivateJobs(source, context);
    }

    if (adapter === "eightfold") {
      return fetchEightfoldJobs(source, context);
    }

    if (adapter === "target") {
      return fetchTargetJobs(source, context);
    }

    if (adapter === "walmart") {
      return fetchWalmartJobs(source, context);
    }

    if (adapter === "yahoo") {
      return fetchYahooJobs(source, context);
    }

    if (adapter === "talentbrew") {
      return fetchTalentBrewJobs(source, context);
    }

    throw new Error(
      `No scraper adapter configured for ${source.companyName} (${source.sourceSlug})`,
    );
  },
};
