import {
  defaultExpiryDate,
  detectWorkMode,
  htmlToText,
  normalizeEmploymentType,
  safeDescription,
  type ImportedJob,
} from "./normalize";
import {
  dedupeBySourceKey,
  isEngineeringText,
  isInternshipText,
  isUsText,
} from "./filters";
import type { JobSource } from "./job-sources";
import type { JobSourceAdapter } from "./source";

const PAGE_SIZE = 20;
const MAX_PAGES = 10;

type WorkdaySearchPosting = {
  title?: string;
  externalPath?: string;
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
};

type WorkdaySearchResponse = {
  total?: number;
  jobPostings?: WorkdaySearchPosting[];
};

type WorkdayDetailResponse = {
  jobPostingInfo?: {
    id?: string;
    title?: string;
    jobDescription?: string;
    externalUrl?: string;
    location?: string;
    locationsText?: string;
    postedOn?: string;
    endDate?: string;
    additionalLocations?: string[];
    jobReqId?: string;
    jobFamily?: string;
    timeType?: string;
  };
};

type WorkdayConfig = {
  apiBase: string;
  publicBase: string;
  searchText: string;
  tenant: string;
  site: string;
};

function metadataString(source: JobSource, key: string) {
  const value = source.metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function workdayConfig(source: JobSource): WorkdayConfig {
  const sourceUrl = source.sourceUrl ? new URL(source.sourceUrl) : null;
  const hostTenant = sourceUrl?.hostname.split(".")[0];
  const tenant = metadataString(source, "tenant") ?? hostTenant;
  const site = metadataString(source, "site") ?? source.sourceSlug;
  const apiBase =
    metadataString(source, "apiBase") ??
    (sourceUrl && tenant
      ? `${sourceUrl.origin}/wday/cxs/${tenant}/${site}`
      : null);
  const publicBase =
    metadataString(source, "publicBase") ??
    source.sourceUrl?.replace(/\/$/, "") ??
    null;

  if (!tenant || !site || !apiBase || !publicBase) {
    throw new Error(
      `Workday source ${source.companyName} is missing tenant/site/sourceUrl metadata`,
    );
  }

  return {
    apiBase: apiBase.replace(/\/$/, ""),
    publicBase,
    searchText: metadataString(source, "searchText") ?? "",
    tenant,
    site,
  };
}

async function fetchWorkdaySearchPage(config: WorkdayConfig, offset: number) {
  const response = await fetch(`${config.apiBase}/jobs`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    body: JSON.stringify({
      appliedFacets: {},
      limit: PAGE_SIZE,
      offset,
      searchText: config.searchText,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const detail = body ? ` ${body.slice(0, 500)}` : "";

    throw new Error(`Workday search failed: ${response.status}${detail}`);
  }

  const body = await response.text();

  try {
    return JSON.parse(body) as WorkdaySearchResponse;
  } catch {
    throw new Error(
      `Workday search returned non-JSON response: ${body.slice(0, 300)}`,
    );
  }
}

async function fetchWorkdayDetail(
  config: WorkdayConfig,
  posting: WorkdaySearchPosting,
) {
  if (!posting.externalPath) return null;

  const response = await fetch(`${config.apiBase}${posting.externalPath}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "HireGeneralJobBoard/1.0",
    },
    cache: "no-store",
  });

  const body = await response.text().catch(() => "");

  if (!response.ok || !body.trim().startsWith("{")) return null;

  try {
    return JSON.parse(body) as WorkdayDetailResponse;
  } catch {
    return null;
  }
}

function applyUrl(config: WorkdayConfig, posting: WorkdaySearchPosting) {
  if (!posting.externalPath) return config.publicBase;

  return `${config.publicBase}${posting.externalPath}`;
}

function sourceId(sourceSlug: string, posting: WorkdaySearchPosting) {
  const fromPath = posting.externalPath?.split("/").filter(Boolean).pop();
  const fallback = (posting.title ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${sourceSlug}:${fromPath ?? fallback}`;
}

function searchableWorkdayText(
  posting: WorkdaySearchPosting,
  detail: WorkdayDetailResponse | null,
) {
  const info = detail?.jobPostingInfo;

  return [
    posting.title,
    posting.locationsText,
    posting.postedOn,
    ...(posting.bulletFields ?? []),
    info?.title,
    info?.location,
    info?.locationsText,
    info?.jobFamily,
    info?.timeType,
    info?.jobDescription,
  ]
    .filter(Boolean)
    .join(" ");
}

function postedAt(value: string | undefined) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  const lower = value.toLowerCase();
  const relativeDays = lower.match(/posted\s+(\d+)\s+days?\s+ago/);

  if (lower.includes("today")) {
    return new Date().toISOString();
  }

  if (lower.includes("yesterday")) {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString();
  }

  if (relativeDays) {
    const date = new Date();
    date.setDate(date.getDate() - Number(relativeDays[1]));
    return date.toISOString();
  }

  return new Date().toISOString();
}

function isoDateOrNull(value: string | undefined) {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeLine(value: string) {
  return value
    .replace(/^[•·\-\u2013\u2014\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
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

function splitListItems(value: string, maxItems: number) {
  const rawLines = value.split(/\n+/).map((line) => line.trim());
  const bulletLines = rawLines
    .filter((line) => /^[•·\-\u2013\u2014]/.test(line))
    .map(normalizeLine)
    .filter((line) => line.length >= 3)
    .filter((line) => !/^(required|desired)?\s*qualifications:?$/i.test(line))
    .filter((line) => !/^job expectations:?$/i.test(line));

  if (bulletLines.length > 1) {
    return uniqueItems(bulletLines).slice(0, maxItems);
  }

  const lines = rawLines
    .map(normalizeLine)
    .filter((line) => line.length >= 3)
    .filter((line) => !/^(required|desired)?\s*qualifications:?$/i.test(line))
    .filter((line) => !/^job expectations:?$/i.test(line));

  if (lines.length > 1) {
    return uniqueItems(lines).slice(0, maxItems);
  }

  return uniqueItems(
    value
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map(normalizeLine)
      .filter((line) => line.length >= 12),
  ).slice(0, maxItems);
}

function parseSalaryRange(value: string) {
  const match = value.match(
    /\$([0-9][0-9,]*(?:\.\d{2})?)\s*[-–]\s*\$([0-9][0-9,]*(?:\.\d{2})?)/,
  );

  if (!match) {
    return {
      min: null,
      max: null,
    };
  }

  return {
    min: Math.round(Number(match[1].replace(/,/g, ""))),
    max: Math.round(Number(match[2].replace(/,/g, ""))),
  };
}

function parsedDescriptionSections(descriptionHtml: string | undefined) {
  const text = htmlToText(descriptionHtml)
    .replace(
      /(\$[0-9][0-9,]*(?:\.\d{2})?\s*[-–]\s*\$[0-9][0-9,]*(?:\.\d{2})?)\s+(Benefits\b)/i,
      "$1\n\n$2",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const markerPattern =
    /^(About this role|About the role|In this role, you will|What you(?:'|’)ll do|Responsibilities|Required Qualifications|Minimum Qualifications|Basic Qualifications|Desired Qualifications|Preferred Qualifications|Qualifications|Requirements|Job Expectations|Pay Range|Benefits|Posting End Date|We Value Equal Opportunity|Applicants with Disabilities|Drug and Alcohol Policy|Wells Fargo Recruitment and Hiring Requirements):?$/gim;

  const markers = [...text.matchAll(markerPattern)].map((match) => ({
    label: match[1].toLowerCase(),
    index: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));

  const section = (labels: string[]) => {
    const chunks: string[] = [];

    markers.forEach((marker, index) => {
      if (!labels.some((label) => marker.label.includes(label))) return;

      const next = markers[index + 1];
      chunks.push(text.slice(marker.end, next?.index ?? text.length).trim());
    });

    return chunks.join("\n");
  };

  const about = section(["about this role", "about the role"]);
  const responsibilities = section([
    "in this role",
    "what you'll do",
    "what you’ll do",
    "responsibilities",
  ]);
  const qualifications = section([
    "required qualifications",
    "minimum qualifications",
    "basic qualifications",
    "desired qualifications",
    "preferred qualifications",
    "qualifications",
    "requirements",
    "job expectations",
  ]);
  const benefits = section(["benefits"]);
  const salary = parseSalaryRange(text);

  return {
    plainText: text,
    about,
    responsibilities: splitListItems(responsibilities, 10),
    requirements: splitListItems(qualifications, 14),
    benefits: splitListItems(benefits, 12),
    salaryMin: salary.min,
    salaryMax: salary.max,
  };
}

function workdayLocation(
  posting: WorkdaySearchPosting,
  info: WorkdayDetailResponse["jobPostingInfo"] | undefined,
) {
  const locations = uniqueItems(
    [
      info?.location,
      ...(info?.additionalLocations ?? []),
      info?.locationsText,
      posting.locationsText,
    ]
      .filter((value): value is string => Boolean(value))
      .flatMap((value) => value.split(/\s*;\s*/))
      .map((value) => value.trim())
      .filter(Boolean),
  );

  return locations.length > 0 ? locations.join(", ") : "United States";
}

async function fetchWorkdayPostings(config: WorkdayConfig) {
  const postings: WorkdaySearchPosting[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetchWorkdaySearchPage(config, page * PAGE_SIZE);
    const pagePostings = response.jobPostings ?? [];

    postings.push(...pagePostings);

    if (pagePostings.length < PAGE_SIZE) break;
    if (response.total && postings.length >= response.total) break;
  }

  return postings;
}

export async function fetchWorkdayJobs(
  source: JobSource,
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const config = workdayConfig(source);
  const postings = await fetchWorkdayPostings(config);
  const jobs: Array<{
    posting: WorkdaySearchPosting;
    detail: WorkdayDetailResponse | null;
  }> = [];

  for (const posting of postings) {
    const detail = await fetchWorkdayDetail(config, posting);
    const text = searchableWorkdayText(posting, detail);

    if (!isUsText(text)) continue;
    if (!isEngineeringText(text)) continue;
    if (isInternshipText(text)) continue;

    jobs.push({ posting, detail });
  }

  const dedupedJobs = dedupeBySourceKey(jobs, ({ posting }) =>
    sourceId(source.sourceSlug, posting),
  );

  return dedupedJobs.map(({ posting, detail }) => {
    const info = detail?.jobPostingInfo;
    const title = (info?.title ?? posting.title ?? "Untitled Workday job")
      .replace(/\s+/g, " ")
      .trim();
    const location = workdayLocation(posting, info);
    const parsedDescription = parsedDescriptionSections(info?.jobDescription);
    const description =
      parsedDescription.about || parsedDescription.plainText || "";

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

      employmentType: normalizeEmploymentType(info?.timeType ?? null),
      workMode: detectWorkMode(title, location),

      salaryMin: parsedDescription.salaryMin,
      salaryMax: parsedDescription.salaryMax,
      salaryCurrency: "USD",

      skills: [],
      responsibilities: parsedDescription.responsibilities,
      requirements: parsedDescription.requirements,
      benefits: parsedDescription.benefits,

      status: "published",

      postedAt: postedAt(posting.postedOn ?? info?.postedOn),
      expiresAt: isoDateOrNull(info?.endDate) ?? defaultExpiryDate(30),

      sourceName: "workday",
      sourceId: sourceId(source.sourceSlug, posting),
      applyUrl: info?.externalUrl ?? applyUrl(config, posting),

      experienceLevel: null,
      category: info?.jobFamily ?? null,

      companyTagline: null,
      companySize: null,
      companyWebsite: source.companyDomain
        ? `https://${source.companyDomain}`
        : null,
    };
  });
}

export const workdayAdapter: JobSourceAdapter = {
  type: "workday",
  fetchJobs: fetchWorkdayJobs,
};
