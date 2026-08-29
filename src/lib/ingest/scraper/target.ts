import {
  defaultExpiryDate,
  detectWorkMode,
  normalizeEmploymentType,
  safeDescription,
} from "../normalize";
import type { ImportedJob } from "../normalize";
import { isEngineeringText, isInternshipText, isUsText } from "../filters";
import type { JobSource } from "../job-sources";
import {
  metadataNumber,
  metadataString,
  metadataStringArray,
  recordNumber,
  splitListItems,
  uniqueItems,
} from "./shared";

export type TargetJobDocument = {
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

export type TargetJobSearchResponse = {
  count?: number;
  results?: Array<{
    document?: TargetJobDocument;
  }>;
};

export const TARGET_DEFAULT_API_URL =
  "https://corporate.target.com/api/jobsearch";

export const TARGET_DEFAULT_MAX_PAGES = 6;

export function targetSearchBody(
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

export function targetPublicUrl(source: JobSource, job: TargetJobDocument) {
  const publicBase =
    metadataString(source, "publicBase") ?? "https://corporate.target.com";

  if (job.url?.startsWith("http")) return job.url;
  if (job.url) return new URL(job.url, publicBase).toString();

  return source.sourceUrl || publicBase;
}

export function targetLocation(job: TargetJobDocument) {
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

export function targetSkills(job: TargetJobDocument) {
  if (Array.isArray(job.jobskills)) {
    return uniqueItems(
      job.jobskills
        .map((skill) => (typeof skill === "string" ? skill.trim() : ""))
        .filter(Boolean),
    ).slice(0, 14);
  }

  return splitListItems(job.jobskills, 14);
}

export function targetDescription(job: TargetJobDocument, title: string) {
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

export function targetPostedAt(value: string | null | undefined) {
  if (!value) return new Date().toISOString();

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

export async function fetchTargetJobs(
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

        const importedJob: ImportedJob = {
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
        };

        jobs.push(importedJob);
      }
    }
  }

  return jobs;
}
