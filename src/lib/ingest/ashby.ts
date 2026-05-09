import {
  defaultExpiryDate,
  detectWorkMode,
  htmlToText,
  normalizeEmploymentType,
  safeDescription,
  type ImportedJob,
} from "./normalize";
import { isEngineeringText, isInternshipText, isUsText } from "./filters";
import type { JobSource } from "./job-sources";
import type { JobSourceAdapter } from "./source";

type AshbyLocation = {
  location?: string;
  address?: {
    postalAddress?: {
      addressCountry?: string;
      addressLocality?: string;
      addressRegion?: string;
    };
  };
};

type AshbyJob = {
  id: string;
  title: string;
  department?: string | null;
  team?: string | null;
  employmentType?: string | null;
  location?: string | null;
  secondaryLocations?: AshbyLocation[];
  publishedAt?: string | null;
  isListed?: boolean;
  isRemote?: boolean;
  workplaceType?: string | null;
  address?: AshbyLocation["address"];
  jobUrl?: string | null;
  applyUrl?: string | null;
  descriptionHtml?: string | null;
};

type AshbyResponse = {
  jobs?: AshbyJob[];
};

function ashbyBoardName(source: JobSource) {
  const value = source.metadata.boardName;
  return typeof value === "string" && value.trim()
    ? value.trim()
    : source.sourceSlug;
}

function postalLocation(location: AshbyLocation) {
  const postal = location.address?.postalAddress;
  const city = postal?.addressLocality?.trim();
  const region = postal?.addressRegion?.trim();

  return [city, region].filter(Boolean).join(", ");
}

function ashbyLocations(job: AshbyJob) {
  const locations = [
    job.location,
    postalLocation({ address: job.address }),
    ...(job.secondaryLocations ?? []).flatMap((location) => [
      location.location,
      postalLocation(location),
    ]),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(locations)];
}

function searchableRoleText(job: AshbyJob) {
  return [job.title, job.department, job.team].filter(Boolean).join(" ");
}

function searchableLocationText(job: AshbyJob) {
  const countries = [
    job.address?.postalAddress?.addressCountry,
    ...(job.secondaryLocations ?? []).map(
      (location) => location.address?.postalAddress?.addressCountry,
    ),
  ];

  return [...ashbyLocations(job), ...countries].filter(Boolean).join(" ");
}

function postedAt(value: string | null | undefined) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function sourceUrl(boardName: string, job: AshbyJob) {
  return (
    job.applyUrl ??
    job.jobUrl ??
    `https://jobs.ashbyhq.com/${encodeURIComponent(boardName)}/${job.id}`
  );
}

export async function fetchAshbyJobs(
  source: JobSource,
  context?: {
    signal?: AbortSignal;
  },
): Promise<ImportedJob[]> {
  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const boardName = ashbyBoardName(source);
  const response = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(
      boardName,
    )}`,
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
    throw new Error(
      `Ashby fetch failed for ${source.companyName} (${boardName}): ${response.status}`,
    );
  }

  const data = (await response.json()) as AshbyResponse;

  if (!Array.isArray(data.jobs)) {
    throw new Error(`Invalid Ashby response for ${source.companyName}`);
  }

  return data.jobs
    .filter((job) => job.isListed !== false)
    .filter((job) => isUsText(searchableLocationText(job)))
    .filter((job) => isEngineeringText(searchableRoleText(job)))
    .filter((job) => !isInternshipText(searchableRoleText(job)))
    .map((job) => {
      const location = ashbyLocations(job).join(", ") || "United States";
      const description = htmlToText(job.descriptionHtml);
      const title = job.title.replace(/\s+/g, " ").trim();

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

        employmentType: normalizeEmploymentType(job.employmentType),
        workMode: detectWorkMode(
          title,
          `${location} ${job.workplaceType ?? ""} ${
            job.isRemote ? "remote" : ""
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

        postedAt: postedAt(job.publishedAt),
        expiresAt: defaultExpiryDate(30),

        sourceName: "ashby",
        sourceId: `${source.sourceSlug}:${job.id}`,
        applyUrl: sourceUrl(boardName, job),

        experienceLevel: null,
        category: job.department ?? job.team ?? null,

        companyTagline: null,
        companySize: null,
        companyWebsite: source.companyDomain
          ? `https://${source.companyDomain}`
          : null,
      };
    });
}

export const ashbyAdapter: JobSourceAdapter = {
  type: "ashby",
  fetchJobs: fetchAshbyJobs,
};
