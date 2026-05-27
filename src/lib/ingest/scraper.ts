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
  category?: string;
  dateText: string;
  location: string;
  sourceId: string;
  title: string;
};

type StgHavasSearchJob = {
  applyUrl: string;
  category: string;
  location: string;
  sourceId: string;
  title: string;
};

type AppcastSearchJob = {
  applyUrl: string;
  category: string;
  location: string;
  sourceId: string;
  title: string;
};

type FoxSearchJob = {
  applyUrl: string;
  brand: string;
  dateText: string;
  location: string;
  sourceId: string;
  title: string;
};

type FedExPreloadJob = {
  applyURL?: string;
  brandName?: string;
  companyName?: string;
  customFields?: Array<{
    cfKey?: string;
    value?: string;
  }>;
  employmentType?: string[];
  isRemote?: boolean;
  locations?: Array<{
    city?: string;
    country?: string;
    countryAbbr?: string;
    locationParsedText?: string;
    locationText?: string;
    state?: string;
    stateAbbr?: string;
  }>;
  reference?: string;
  requisitionID?: string;
  title?: string;
  uniqueID?: string;
};

type JibeJobData = {
  category?: string | string[];
  city?: string;
  country?: string;
  country_code?: string;
  description?: string;
  employment_type?: string;
  location?: string;
  posted_date?: string;
  postedDate?: string;
  req_id?: string;
  remote_eligible?: boolean | string;
  slug?: string;
  state?: string;
  tags2?: string | Array<{ name?: string }>;
  title?: string;
  updated?: string;
  updated_at?: string;
};

type JibeJob = {
  data?: JibeJobData;
};

type JibeSearchResponse = {
  count?: number;
  jobs?: JibeJob[];
  totalCount?: number;
};

type KulaJob = {
  ats_job?: {
    ats_department?: {
      name?: string;
    };
    compensation?: {
      base_salary?: {
        currency?: string;
        max_amount?: string;
        min_amount?: string;
      };
    };
    employment_type?: string;
    offices?: Array<{
      city?: string;
      country?: string;
      location?: string;
      name?: string;
      remote?: boolean;
      state?: string;
    }>;
    workplace?: string;
  };
  id?: number | string;
  listed?: boolean;
  title?: string;
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
const STG_HAVAS_DEFAULT_MAX_PAGES = 4;
const APPCAST_DEFAULT_MAX_PAGES = 1;
const FOX_DEFAULT_API_URL = "https://www.foxcareers.com/Search/JobsList/";
const FOX_DEFAULT_MAX_PAGES = 4;
const ATTRAX_DEFAULT_MAX_PAGES = 3;
const JIBE_DEFAULT_MAX_PAGES = 8;

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

function htmlAttribute(value: string, attribute: string) {
  const match = value.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"));

  return match?.[1] ? decodeHtml(match[1]).trim() : "";
}

function numberRangeFromText(value: string) {
  const amounts = [...value.matchAll(/\$?\s*([\d,]+)(?:\.\d{2})?/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  if (amounts.length === 0) return { min: null, max: null };

  const min = Math.min(...amounts);
  const max = Math.max(...amounts);

  return { min, max: max === min ? null : max };
}

function isoDateFromText(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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
    /<a\b(?=[^>]*class=["'][^"']*\blink\b)(?=[^>]*href=["']([^"']+)["'])[^>]*>([\s\S]*?)<\/a>/i,
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

function avatureArticleBlocks(html: string) {
  const starts = [
    ...html.matchAll(
      /<article\b[^>]*class=["'][^"']*\barticle--result\b[^"']*["'][^>]*>/gi,
    ),
  ].map((match) => match.index ?? 0);

  return starts.map((start, index) =>
    html.slice(start, starts[index + 1] ?? html.length),
  );
}

function parseAvatureJobs(source: JobSource, html: string) {
  return avatureArticleBlocks(html)
    .map((article) => parseAvatureArticle(source, article))
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
  const country = metadataString(source, "country");
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
      if (!isUsText(locationText)) continue;
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

  return {
    headers,
    html,
  };
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

function jsonArrayAt(text: string, startIndex: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const character = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;

      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return "";
}

function eightfoldJobsFromHtml(html: string) {
  const candidates = [html, decodeHtml(html)];

  for (const candidate of candidates) {
    for (const key of ["positions", "jobs", "results"]) {
      const keyMatcher = new RegExp(`"${key}"\\s*:\\s*\\[`, "g");
      let match: RegExpExecArray | null;

      while ((match = keyMatcher.exec(candidate))) {
        const arrayStart = candidate.indexOf("[", match.index);
        if (arrayStart === -1) continue;

        const arrayJson = jsonArrayAt(candidate, arrayStart);
        if (!arrayJson) continue;

        try {
          const parsed = JSON.parse(arrayJson) as unknown;

          if (
            Array.isArray(parsed) &&
            parsed.some((item) => item && typeof item === "object")
          ) {
            return parsed.filter(
              (item): item is EightfoldJob =>
                Boolean(item) && typeof item === "object",
            );
          }
        } catch {
          continue;
        }
      }
    }
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
  const session = await eightfoldSessionHeaders(source, context);

  for (let page = 0; page < maxPages; page += 1) {
    const start = page * pageSize;
    const response = await fetch(eightfoldJobsUrl(source, start), {
      headers: session.headers,
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      if (page === 0) {
        const fallbackJobs = eightfoldJobsFromHtml(session.html);

        if (fallbackJobs.length > 0) {
          for (const job of fallbackJobs) {
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
                recordString(job, [
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
              responsibilities: splitListItems(description, 12),
              requirements: splitListItems(description, 14),
              benefits: [],

              status: "published",

              postedAt: eightfoldPostedAt(job),
              expiresAt: defaultExpiryDate(30),

              sourceName: "scraper",
              sourceId,
              applyUrl: eightfoldApplyUrl(source, job),

              experienceLevel: null,
              category,

              companyTagline: null,
              companySize: null,
              companyWebsite,
            });
          }

          return jobs;
        }
      }

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
        session.headers,
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

function talentBrewCitiResults(html: string, publicBase: string) {
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

function talentBrewSearchResultsList(html: string, publicBase: string) {
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

function talentBrewPlainResults(html: string, publicBase: string) {
  const section =
    html.match(
      /<section\b[^>]*id=["']search-results-list["'][^>]*>([\s\S]*?)<\/section>/i,
    )?.[1] ?? "";

  return [...section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match): TalentBrewSearchJob | null => {
      const item = match[1];
      const link = item.match(
        /<a\b[^>]*href=["']([^"']+)["'][^>]*data-job-id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
      );

      if (!link) return null;

      const [, href, sourceId, body] = link;
      const title = body.match(
        /<h2\b[^>]*class=["']title["'][^>]*>([\s\S]*?)<\/h2>/i,
      )?.[1];
      const location = body.match(
        /<span\b[^>]*class=["']location["'][^>]*>([\s\S]*?)<\/span>/i,
      )?.[1];
      const category = body.match(
        /<span\b[^>]*class=["']category["'][^>]*>([\s\S]*?)<\/span>/i,
      )?.[1];

      if (!title) return null;

      return {
        applyUrl: new URL(decodeHtml(href), publicBase).toString(),
        category: htmlToText(decodeHtml(category ?? ""))
          .replace(/^Category:\s*/i, "")
          .trim(),
        dateText: "",
        location: htmlToText(decodeHtml(location ?? "")).trim(),
        sourceId,
        title: htmlToText(decodeHtml(title)).trim(),
      };
    })
    .filter((job): job is TalentBrewSearchJob => job !== null);
}

function talentBrewResults(html: string, publicBase: string) {
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

function appcastPageUrl(source: JobSource, page: number) {
  const url = new URL(
    source.sourceUrl ?? "https://careers.expediagroup.com/jobs/",
  );
  const pageParam = metadataString(source, "pageParam") ?? "pg";

  if (page > 1) {
    url.searchParams.set(pageParam, String(page));
  }

  return url;
}

function appcastResults(html: string, publicBase: string) {
  return [
    ...html.matchAll(
      /<li\b[^>]*class=["'][^"']*\bResults__list__item\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi,
    ),
  ]
    .map((match) => {
      const item = match[1];
      const link = item.match(
        /<a\b(?=[^>]*class=["'][^"']*\bview-job-button\b)(?=[^>]*href=["']([^"']+)["'])[^>]*>/i,
      );
      const title = item.match(
        /<h3\b[^>]*class=["'][^"']*\bResults__list__title\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i,
      )?.[1];
      const location = item.match(
        /<h4\b[^>]*class=["'][^"']*\bResults__list__location\b[^"']*["'][^>]*>([\s\S]*?)<\/h4>/i,
      )?.[1];
      const category = item.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];

      if (!link || !title) return null;

      const [, href] = link;
      const sourceId =
        decodeHtml(href).match(/\/job\/[^/]+\/[^/]+\/([^/?#]+)/)?.[1] ??
        decodeHtml(href);

      return {
        applyUrl: new URL(decodeHtml(href), publicBase).toString(),
        category: htmlToText(decodeHtml(category ?? "")).trim(),
        location: htmlToText(decodeHtml(location ?? "")).trim(),
        sourceId,
        title: htmlToText(decodeHtml(title)).trim(),
      };
    })
    .filter((job): job is AppcastSearchJob => Boolean(job?.title));
}

async function fetchAppcastJobs(
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
    "https://careers.expediagroup.com";
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? APPCAST_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetch(appcastPageUrl(source, page), {
      headers: {
        Accept: "text/html",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`Appcast fetch failed: ${response.status}`);
    }

    const pageJobs = appcastResults(await response.text(), publicBase);
    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      const sourceId = `${source.sourceSlug}:${job.sourceId}`;
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const searchText = `${job.title} ${job.category} ${job.location}`;
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

        postedAt: new Date().toISOString(),
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId,
        applyUrl: job.applyUrl,

        experienceLevel: null,
        category: job.category || category,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }
  }

  return jobs;
}

function foxJobsListUrl(source: JobSource, page: number) {
  const apiUrl = metadataString(source, "apiUrl") ?? FOX_DEFAULT_API_URL;
  const params = {
    page: String(page),
    jobFunction:
      metadataString(source, "jobFunction") ??
      "Information Technology_Technology",
    brand: metadataString(source, "brand") ?? "",
    subBrand: metadataString(source, "subBrand") ?? "",
    brandCategory: metadataString(source, "brandCategory") ?? "",
    country: metadataString(source, "country") ?? "United States of America",
    location: metadataString(source, "location") ?? "",
    locationType: metadataString(source, "locationType") ?? "",
    experienceLevel: metadataString(source, "experienceLevel") ?? "",
    city: metadataString(source, "city") ?? "",
    latitude: metadataString(source, "latitude") ?? "0",
    longitude: metadataString(source, "longitude") ?? "0",
    keyword: metadataString(source, "keyword") ?? "",
    language: metadataString(source, "language") ?? "undefined",
  };
  const query = Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");

  return `${apiUrl}?${query}`;
}

function foxPostedAt(value: string) {
  const dateText = value.replace(/^Job Posting Date:\s*/i, "").trim();
  const parsed = new Date(dateText);

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function foxResults(html: string, publicBase: string) {
  return [
    ...html.matchAll(
      /<div\b[^>]*class=["'][^"']*\bjobListing\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    ),
  ]
    .map((match) => {
      const item = match[1];
      const link = item.match(
        /<a\b[^>]*class=["'][^"']*\bsearchResultTitle\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
      );

      if (!link) return null;

      const [, href, titleHtml] = link;
      const title = htmlToText(
        decodeHtml(titleHtml.replace(/<span\b[\s\S]*?<\/span>/gi, "")),
      )
        .replace(/\s+/g, " ")
        .trim();
      const brand = item.match(
        /<p\b[^>]*class=["'][^"']*\bsearchResultBrand\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
      )?.[1];
      const detailMatches = [
        ...item.matchAll(
          /<p\b[^>]*class=["'][^"']*\bsearchResultDetail\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/gi,
        ),
      ].map((detail) => htmlToText(decodeHtml(detail[1])).trim());
      const location =
        detailMatches.find((detail) => !/^Job Posting Date:/i.test(detail)) ??
        "";
      const dateText =
        detailMatches.find((detail) => /^Job Posting Date:/i.test(detail)) ??
        "";
      const sourceId =
        decodeHtml(href).match(/\/Search\/JobDetail\/([^/]+)/)?.[1] ??
        decodeHtml(href);

      return {
        applyUrl: new URL(decodeHtml(href), publicBase).toString(),
        brand: htmlToText(decodeHtml(brand ?? "")).trim(),
        dateText,
        location: location.replace(/;$/, "").trim(),
        sourceId,
        title,
      };
    })
    .filter((job): job is FoxSearchJob => Boolean(job?.title));
}

async function fetchFoxJobs(
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
    metadataString(source, "publicBase") ?? "https://www.foxcareers.com";
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? FOX_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 0; page < maxPages; page += 1) {
    const response = await fetch(foxJobsListUrl(source, page), {
      headers: {
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "HireGeneralJobBoard/1.0",
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`Fox careers fetch failed: ${response.status}`);
    }

    const pageJobs = foxResults(await response.text(), publicBase);
    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      const sourceId = `${source.sourceSlug}:${job.sourceId}`;
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const searchText = `${job.title} ${job.brand} ${job.location}`;
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

        postedAt: foxPostedAt(job.dateText),
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
  }

  return jobs;
}

function attraxTileBlocks(html: string) {
  const starts = [
    ...html.matchAll(/<div\b[^>]*class=["'][^"']*\battrax-vacancy-tile\b/gi),
  ].map((match) => match.index ?? 0);

  return starts.map((start, index) =>
    html.slice(start, starts[index + 1] ?? html.length),
  );
}

function attraxValue(block: string, className: string) {
  const classPattern = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const section = block.match(
    new RegExp(
      `<[^>]*class=["'][^"']*\\b${classPattern}\\b[^"']*["'][^>]*>([\\s\\S]*?)(?=<div\\b[^>]*class=["'][^"']*\\battrax-vacancy-tile__|<a\\b[^>]*class=["'][^"']*\\battrax-vacancy-tile__|$)`,
      "i",
    ),
  )?.[1];

  if (!section) return "";

  const value =
    section.match(
      /<p\b[^>]*class=["'][^"']*\battrax-vacancy-tile__item-value\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i,
    )?.[1] ?? section;

  return htmlToText(decodeHtml(value)).replace(/\s+/g, " ").trim();
}

function attraxPageUrl(source: JobSource, page: number) {
  const url = new URL(source.sourceUrl ?? "https://jobs.experian.com/jobs");
  url.searchParams.set("page", String(page));

  return url;
}

async function fetchAttraxJobs(
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
    "https://jobs.experian.com";
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? ATTRAX_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetch(attraxPageUrl(source, page), {
      headers: {
        Accept: "text/html",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`Attrax fetch failed: ${response.status}`);
    }

    const blocks = attraxTileBlocks(await response.text());
    if (blocks.length === 0) break;

    for (const block of blocks) {
      const titleLink = block.match(
        /<a\b[^>]*class=["'][^"']*\battrax-vacancy-tile__title\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
      );
      if (!titleLink) continue;

      const sourceId =
        htmlAttribute(block, "data-jobid") || decodeHtml(titleLink[1]);
      const fullSourceId = `${source.sourceSlug}:${sourceId}`;
      if (seenSourceIds.has(fullSourceId)) continue;
      seenSourceIds.add(fullSourceId);

      const title = htmlToText(decodeHtml(titleLink[2]))
        .replace(/\s+/g, " ")
        .trim();
      const location =
        attraxValue(block, "attrax-vacancy-tile__location-freetext") ||
        attraxValue(block, "attrax-vacancy-tile__option-location") ||
        "United States";
      const roleType = attraxValue(
        block,
        "attrax-vacancy-tile__option-role-type",
      );
      const schedule = attraxValue(
        block,
        "attrax-vacancy-tile__option-schedule",
      );
      const salaryText = attraxValue(
        block,
        "attrax-vacancy-tile__option-salary-range",
      );
      const department = attraxValue(
        block,
        "attrax-vacancy-tile__option-department",
      );
      const description = safeDescription({
        description:
          attraxValue(block, "attrax-vacancy-tile__description") ||
          `${title} role at ${source.companyName}. Visit the company careers site for the full description and application details.`,
        title,
        companyName: source.companyName,
      });
      const searchText = `${title} ${department} ${description} ${category}`;

      if (!isUsText(location)) continue;
      if (!isEngineeringText(searchText)) continue;
      if (isInternshipText(searchText)) continue;

      const salary = numberRangeFromText(salaryText);

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

        employmentType: normalizeEmploymentType(schedule),
        workMode: detectWorkMode(`${title} ${roleType}`, location),

        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: [],
        requirements: [],
        benefits: [],

        status: "published",

        postedAt: new Date().toISOString(),
        expiresAt:
          isoDateFromText(attraxValue(block, "attrax-vacancy-tile__expiry")) ??
          defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId: fullSourceId,
        applyUrl: new URL(decodeHtml(titleLink[1]), publicBase).toString(),

        experienceLevel:
          attraxValue(block, "attrax-vacancy-tile__option-experience-level") ||
          null,
        category: department || category,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }
  }

  return jobs;
}

function fedexPreloadState(html: string) {
  const match = html.match(
    /window\.__PRELOAD_STATE__\s*=\s*({[\s\S]*?});\s*<\/script>/i,
  );

  if (!match) return [];

  try {
    const data = JSON.parse(match[1]) as {
      jobSearch?: {
        jobs?: FedExPreloadJob[];
      };
    };

    return Array.isArray(data.jobSearch?.jobs) ? data.jobSearch.jobs : [];
  } catch {
    return [];
  }
}

function fedexLocation(job: FedExPreloadJob) {
  const locations = job.locations ?? [];
  const usLocations = locations.filter(
    (location) =>
      location.countryAbbr === "US" ||
      /^United States/i.test(location.country ?? ""),
  );
  const selected = usLocations.length > 0 ? usLocations : locations;
  const labels = selected
    .map((location) => {
      const city = location.city?.trim();
      const state = (location.stateAbbr ?? location.state)?.trim();
      const country = location.country?.trim();

      return [city, state, country].filter(Boolean).join(", ");
    })
    .filter(Boolean);

  return uniqueItems(labels).slice(0, 4).join(", ") || "United States";
}

async function fetchFedExPreloadJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const response = await fetch(
    source.sourceUrl ??
      "https://careers.fedex.com/career-areas/professional/jobs",
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
    throw new Error(`FedEx careers fetch failed: ${response.status}`);
  }

  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const job of fedexPreloadState(await response.text())) {
    const title = job.title?.trim();
    const applyUrl = job.applyURL?.trim();
    if (!title || !applyUrl) continue;

    const sourceId = `${source.sourceSlug}:${
      job.requisitionID ?? job.reference ?? job.uniqueID ?? applyUrl
    }`;
    if (seenSourceIds.has(sourceId)) continue;
    seenSourceIds.add(sourceId);

    const location = fedexLocation(job);
    const fields = (job.customFields ?? [])
      .map((field) => field.value)
      .join(" ");
    const searchText = `${title} ${location} ${fields} ${category}`;

    if (!isUsText(location)) continue;
    if (!isEngineeringText(searchText)) continue;
    if (isInternshipText(searchText)) continue;

    const description = safeDescription({
      title,
      companyName: source.companyName,
      description: `${title} role at ${source.companyName}. Visit the company careers site for the complete description and application details.`,
    });

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

      employmentType: normalizeEmploymentType(job.employmentType?.join(" ")),
      workMode: detectWorkMode(title, `${location} ${String(job.isRemote)}`),

      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",

      skills: [],
      responsibilities: [],
      requirements: [],
      benefits: [],

      status: "published",

      postedAt: new Date().toISOString(),
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

  return jobs;
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

        const searchText = `${job.title} ${job.category ?? ""} ${job.location} ${searchTerm}`;
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
          category: job.category || category,

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

function stgHavasPageUrl(source: JobSource, page: number) {
  const url = new URL(
    source.sourceUrl ??
      "https://search-ihgcareers.stghavaspeople.com/en/search-and-apply/",
  );

  if (page > 1) {
    url.searchParams.set("page", String(page));
  }

  return url;
}

function stgHavasResultBlocks(html: string) {
  const starts = [
    ...html.matchAll(/<div\b[^>]*class=["'][^"']*\bitem\b/gi),
  ].map((match) => match.index ?? 0);

  return starts.map((start, index) =>
    html.slice(start, starts[index + 1] ?? html.length),
  );
}

function stgHavasResults(html: string, publicBase: string) {
  return stgHavasResultBlocks(html)
    .map((block) => {
      const jobSection = block.match(
        /<div\b[^>]*class=["'][^"']*\blatest-jobs-section-jobs_department\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<div\b[^>]*class=["'][^"']*\blatest-jobs-section-jobs_location\b/i,
      )?.[1];
      const locationSection = block.match(
        /<div\b[^>]*class=["'][^"']*\blatest-jobs-section-jobs_location\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<div\b[^>]*class=["'][^"']*\blatest-jobs-section-jobs_link\b/i,
      )?.[1];

      if (!jobSection || !locationSection) return null;

      const href = jobSection.match(/<a\b[^>]*href=["']([^"']+)["']/i)?.[1];
      const title = jobSection.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1];
      const category = [...jobSection.matchAll(/<h5\b[^>]*>([\s\S]*?)<\/h5>/gi)]
        .map((match) => htmlToText(decodeHtml(match[1])).trim())
        .filter(Boolean)
        .join(" ");
      const location = [
        locationSection.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1],
        locationSection.match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i)?.[1],
      ]
        .map((value) => htmlToText(decodeHtml(value ?? "")).trim())
        .filter(Boolean)
        .join(", ");

      if (!href || !title) return null;

      const decodedHref = decodeHtml(href);
      const sourceId =
        decodedHref.match(/[?&]jobref=([^&#]+)/)?.[1] ??
        htmlAttribute(block, "data-anchor") ??
        decodedHref;

      return {
        applyUrl: new URL(decodedHref, publicBase).toString(),
        category,
        location,
        sourceId,
        title: htmlToText(decodeHtml(title)).trim(),
      };
    })
    .filter((job): job is StgHavasSearchJob => Boolean(job?.title));
}

async function fetchStgHavasJobs(
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
    "https://search-ihgcareers.stghavaspeople.com";
  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? STG_HAVAS_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetch(stgHavasPageUrl(source, page), {
      headers: {
        Accept: "text/html",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`STG Havas careers fetch failed: ${response.status}`);
    }

    const pageJobs = stgHavasResults(await response.text(), publicBase);
    if (pageJobs.length === 0) break;

    for (const job of pageJobs) {
      const sourceId = `${source.sourceSlug}:${job.sourceId}`;
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const searchText = `${job.title} ${job.category} ${job.location}`;
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
        workMode: detectWorkMode(`${job.title} ${job.category}`, job.location),

        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: [],
        requirements: [],
        benefits: [],

        status: "published",

        postedAt: new Date().toISOString(),
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId,
        applyUrl: job.applyUrl,

        experienceLevel: null,
        category: job.category || category,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }
  }

  return jobs;
}

function jibeJobsUrl(source: JobSource, page: number) {
  const apiUrl =
    metadataString(source, "apiUrl") ??
    new URL(
      "/api/jobs",
      source.sourceUrl ?? "https://careers.ice.com",
    ).toString();
  const url = new URL(apiUrl);
  const query =
    source.metadata.query && typeof source.metadata.query === "object"
      ? (source.metadata.query as Record<string, unknown>)
      : {};

  for (const [key, value] of Object.entries(query)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      url.searchParams.set(key, String(value));
    }
  }

  url.searchParams.set("page", String(page));
  return url;
}

function jibeTags(value: JibeJobData["tags2"]) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => tag.name ?? "")
      .filter(Boolean)
      .join(" ");
  }

  return value ?? "";
}

function jibeCategory(value: JibeJobData["category"], fallback: string) {
  if (Array.isArray(value)) {
    return value.find((item) => item.trim())?.trim() ?? fallback;
  }

  return value?.trim() || fallback;
}

function jibeLocation(job: JibeJobData) {
  if (job.location?.trim()) return job.location.trim();

  return (
    [job.city, job.state, job.country].filter(Boolean).join(", ") ||
    "United States"
  );
}

function jibePostedAt(job: JibeJobData) {
  return (
    isoDateFromText(job.posted_date) ??
    isoDateFromText(job.postedDate) ??
    isoDateFromText(job.updated_at) ??
    isoDateFromText(job.updated) ??
    new Date().toISOString()
  );
}

function jibeApplyUrl(source: JobSource, job: JibeJobData) {
  const publicBase =
    metadataString(source, "publicBase") ??
    source.sourceUrl ??
    "https://careers.ice.com";

  if (job.slug) {
    return new URL(`/jobs/${job.slug}`, publicBase).toString();
  }

  return source.sourceUrl ?? publicBase;
}

async function fetchJibeJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const maxPages = Math.max(
    metadataNumber(source, "maxPages") ?? JIBE_DEFAULT_MAX_PAGES,
    1,
  );
  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetch(jibeJobsUrl(source, page), {
      headers: {
        Accept: "application/json",
        "User-Agent": "HireGeneralJobBoard/1.0",
      },
      cache: "no-store",
      signal: context?.signal,
    });

    if (!response.ok) {
      throw new Error(`Jibe careers fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as JibeSearchResponse;
    const pageJobs = Array.isArray(data.jobs) ? data.jobs : [];
    if (pageJobs.length === 0) break;

    for (const item of pageJobs) {
      const job = item.data;
      if (!job?.title?.trim()) continue;

      const sourceId = `${source.sourceSlug}:${
        job.req_id ?? job.slug ?? job.title
      }`;
      if (seenSourceIds.has(sourceId)) continue;
      seenSourceIds.add(sourceId);

      const title = job.title.trim();
      const location = jibeLocation(job);
      const jobCategory = jibeCategory(job.category, category);
      const description = safeDescription({
        description: htmlToText(job.description),
        title,
        companyName: source.companyName,
      });
      const searchText = [
        title,
        description,
        jobCategory,
        jibeTags(job.tags2),
        category,
      ]
        .filter(Boolean)
        .join(" ");

      if (
        !isUsText(`${location} ${job.country_code ?? ""} ${job.country ?? ""}`)
      )
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

        latitude: null,
        longitude: null,

        employmentType: normalizeEmploymentType(job.employment_type),
        workMode: detectWorkMode(
          title,
          `${location} ${String(job.remote_eligible ?? "")}`,
        ),

        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",

        skills: [],
        responsibilities: splitListItems(description, 12),
        requirements: splitListItems(description, 14),
        benefits: [],

        status: "published",

        postedAt: jibePostedAt(job),
        expiresAt: defaultExpiryDate(30),

        sourceName: "scraper",
        sourceId,
        applyUrl: jibeApplyUrl(source, job),

        experienceLevel: null,
        category: jobCategory,

        companyTagline: null,
        companySize: null,
        companyWebsite,
      });
    }

    if (
      pageJobs.length < (data.count ?? pageJobs.length) ||
      (data.totalCount && jobs.length >= data.totalCount)
    ) {
      break;
    }
  }

  return jobs;
}

function balancedJsonObjects(value: string, marker: string) {
  const objects: string[] = [];
  let searchIndex = 0;

  while (searchIndex < value.length) {
    const start = value.indexOf(marker, searchIndex);
    if (start < 0) break;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < value.length; index += 1) {
      const char = value[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "{") depth += 1;
      if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          objects.push(value.slice(start, index + 1));
          searchIndex = index + 1;
          break;
        }
      }
    }

    if (searchIndex <= start) searchIndex = start + marker.length;
  }

  return objects;
}

function kulaJobsFromHtml(html: string) {
  const normalized = decodeHtml(html)
    .replace(/\\u0026/g, "&")
    .replace(/\\"/g, '"');

  return uniqueItems(balancedJsonObjects(normalized, '{"id":'))
    .map((raw) => {
      try {
        return JSON.parse(raw) as KulaJob;
      } catch {
        return null;
      }
    })
    .filter((job): job is KulaJob =>
      Boolean(job?.title && job.ats_job && job.listed !== false),
    );
}

function kulaLocation(job: KulaJob) {
  const locations = uniqueItems(
    (job.ats_job?.offices ?? [])
      .map(
        (office) =>
          office.location ||
          [office.city, office.state, office.country]
            .filter(Boolean)
            .join(", "),
      )
      .filter(Boolean),
  );

  if (locations.length === 0) return "United States";
  if (locations.length === 1) return locations[0];

  return `${locations[0]}, ${locations.length - 1} locations`;
}

function kulaLocationSearchText(job: KulaJob) {
  return (job.ats_job?.offices ?? [])
    .map((office) =>
      [
        office.name,
        office.location,
        office.city,
        office.state,
        office.country,
        String(office.remote ?? ""),
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ");
}

function kulaApplyUrl(source: JobSource, job: KulaJob) {
  const accountName =
    metadataString(source, "accountName") ?? source.sourceSlug;
  const publicBase =
    metadataString(source, "publicBase") ?? "https://careers.kula.ai";

  if (job.id) {
    return new URL(
      `/${accountName}/${encodeURIComponent(String(job.id))}`,
      publicBase,
    ).toString();
  }

  return source.sourceUrl ?? new URL(`/${accountName}`, publicBase).toString();
}

async function fetchKulaJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const response = await fetch(
    source.sourceUrl ?? "https://careers.kula.ai/varo-money",
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
    throw new Error(`Kula careers fetch failed: ${response.status}`);
  }

  const category = metadataString(source, "category") ?? "Technology";
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();

  for (const job of kulaJobsFromHtml(await response.text())) {
    const title = job.title?.trim();
    if (!title) continue;

    const sourceId = `${source.sourceSlug}:${job.id ?? title}`;
    if (seenSourceIds.has(sourceId)) continue;
    seenSourceIds.add(sourceId);

    const department = job.ats_job?.ats_department?.name ?? category;
    const location = kulaLocation(job);
    const searchText = [
      title,
      department,
      job.ats_job?.employment_type,
      job.ats_job?.workplace,
      kulaLocationSearchText(job),
    ]
      .filter(Boolean)
      .join(" ");

    if (!isUsText(`${location} ${kulaLocationSearchText(job)}`)) continue;
    if (!isEngineeringText(searchText)) continue;
    if (isInternshipText(searchText)) continue;

    const salary = job.ats_job?.compensation?.base_salary;
    const minSalary = salary ? recordNumber(salary, ["min_amount"]) : null;
    const maxSalary = salary ? recordNumber(salary, ["max_amount"]) : null;
    const description = safeDescription({
      title,
      companyName: source.companyName,
      description: `${title} role on ${source.companyName}'s ${department} team. Visit the company careers site for the complete description and application details.`,
    });

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

      employmentType: normalizeEmploymentType(job.ats_job?.employment_type),
      workMode: detectWorkMode(
        title,
        `${location} ${job.ats_job?.workplace ?? ""}`,
      ),

      salaryMin: minSalary,
      salaryMax: maxSalary,
      salaryCurrency: salary?.currency ?? "USD",

      skills: [],
      responsibilities: [],
      requirements: [],
      benefits: [],

      status: "published",

      postedAt: new Date().toISOString(),
      expiresAt: defaultExpiryDate(30),

      sourceName: "scraper",
      sourceId,
      applyUrl: kulaApplyUrl(source, job),

      experienceLevel: null,
      category: department,

      companyTagline: null,
      companySize: null,
      companyWebsite,
    });
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

    if (adapter === "stg-havas") {
      return fetchStgHavasJobs(source, context);
    }

    if (adapter === "appcast") {
      return fetchAppcastJobs(source, context);
    }

    if (adapter === "fox") {
      return fetchFoxJobs(source, context);
    }

    if (adapter === "attrax") {
      return fetchAttraxJobs(source, context);
    }

    if (adapter === "fedex-preload") {
      return fetchFedExPreloadJobs(source, context);
    }

    if (adapter === "jibe") {
      return fetchJibeJobs(source, context);
    }

    if (adapter === "kula") {
      return fetchKulaJobs(source, context);
    }

    throw new Error(
      `No scraper adapter configured for ${source.companyName} (${source.sourceSlug})`,
    );
  },
};
