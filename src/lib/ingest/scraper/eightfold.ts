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
  decodeHtml,
  includesAnyTerm,
  metadataNumber,
  metadataString,
  metadataStringArray,
  recordNumber,
  recordString,
  splitListItems,
  uniqueItems,
} from "./shared";

export type EightfoldJob = Record<string, unknown>;

export type EightfoldResponse =
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

export const EIGHTFOLD_DEFAULT_PAGE_SIZE = 10;

export const EIGHTFOLD_DEFAULT_MAX_PAGES = 10;

export function eightfoldJobsUrl(
  source: JobSource,
  start: number,
  query?: string,
) {
  const apiBase =
    metadataString(source, "apiBase") ??
    source.sourceUrl ??
    "https://morganstanley.eightfold.ai";
  const domain =
    metadataString(source, "domain") ??
    source.companyDomain ??
    new URL(apiBase).hostname;
  const searchText =
    query ?? metadataString(source, "searchText") ?? "technology";
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

export function eightfoldJobDetailsUrl(source: JobSource, job: EightfoldJob) {
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

export function splitSetCookieHeader(value: string) {
  return value.split(/,(?=\s*[^;,=]+=[^;,]+)/g);
}

export function responseCookies(headers: Headers) {
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

export function htmlCsrfToken(html: string) {
  const match = html.match(
    /<meta\s+name=["']_csrf["']\s+content=["']([^"']+)["']/i,
  );

  return match?.[1] ?? "";
}

export async function eightfoldSessionHeaders(
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

export function eightfoldJobsFromResponse(data: EightfoldResponse) {
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

export function jsonArrayAt(text: string, startIndex: number) {
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

export function eightfoldJobsFromHtml(html: string) {
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

export function eightfoldLocation(job: EightfoldJob) {
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

export function eightfoldLocationSearchText(job: EightfoldJob) {
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

export function eightfoldDescription(job: EightfoldJob) {
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

export function eightfoldPostedAt(job: EightfoldJob) {
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

export function eightfoldApplyUrl(source: JobSource, job: EightfoldJob) {
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

export function eightfoldSourceId(source: JobSource, job: EightfoldJob) {
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

export async function fetchEightfoldJobDetails(
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

export async function fetchEightfoldJobs(
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
  const searchTexts = uniqueItems(
    [
      ...(metadataStringArray(source, "searchTexts") ?? []),
      metadataString(source, "searchText") ?? "technology",
    ].filter(Boolean),
  );
  const requiredTerms = metadataStringArray(source, "requiredTerms") ?? [];
  const titleTerms = metadataStringArray(source, "titleTerms") ?? [];
  const excludedTitleTerms =
    metadataStringArray(source, "excludedTitleTerms") ?? [];
  const fetchDetails = source.metadata?.fetchDetails !== false;
  const companyWebsite =
    metadataString(source, "companyWebsite") ??
    (source.companyDomain ? `https://${source.companyDomain}` : null);
  const jobs: ImportedJob[] = [];
  const seenSourceIds = new Set<string>();
  const session = await eightfoldSessionHeaders(source, context);

  const appendFallbackJobsFromHtml = () => {
    const fallbackJobs = eightfoldJobsFromHtml(session.html);

    if (fallbackJobs.length === 0) return false;

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

    return true;
  };

  for (const query of searchTexts) {
    for (let page = 0; page < maxPages; page += 1) {
      const start = page * pageSize;
      const response = await fetch(eightfoldJobsUrl(source, start, query), {
        headers: session.headers,
        cache: "no-store",
        signal: context?.signal,
      });

      if (!response.ok) {
        if (page === 0 && jobs.length === 0) {
          if (appendFallbackJobsFromHtml()) return jobs;
        }

        throw new Error(`Eightfold fetch failed: ${response.status}`);
      }

      const data = (await response.json()) as EightfoldResponse;
      const pageJobs = eightfoldJobsFromResponse(data);

      if (pageJobs.length === 0) {
        if (page === 0 && jobs.length === 0 && appendFallbackJobsFromHtml()) {
          return jobs;
        }

        break;
      }

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

        const detailedJob = fetchDetails
          ? await fetchEightfoldJobDetails(
              source,
              job,
              session.headers,
              context,
            )
          : job;
        const detailedDescription = safeDescription({
          description: eightfoldDescription(detailedJob),
          title,
          companyName: source.companyName,
        });

        const importedJob: ImportedJob = {
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
        };

        jobs.push(importedJob);
      }

      if (pageJobs.length < pageSize) break;
    }
  }

  return jobs;
}
