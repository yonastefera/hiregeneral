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
  normalizedJobTitleKey,
} from "../filters";
import type { JobSource } from "../job-sources";
import { metadataString, splitListItems } from "./shared";

export type PlayrixJob = {
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

export type PlayrixResponse = {
  success?: boolean;
  items?: PlayrixJob[];
};

export const PLAYRIX_DEFAULT_API_URL =
  "https://playrix.com/api/v1/index.php?action=job/getList";

export function playrixPostedAt(value: string | null | undefined) {
  if (!value) return new Date().toISOString();

  const parsed = new Date(value.replace(" ", "T"));

  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export function playrixApplyUrl(publicBase: string, job: PlayrixJob) {
  if (job.code) {
    return `${publicBase.replace(/\/$/, "")}/job/open/${job.code}`;
  }

  return `${publicBase.replace(/\/$/, "")}/job/open`;
}

export function playrixSourceId(sourceSlug: string, job: PlayrixJob) {
  const normalizedTitle = normalizedJobTitleKey(job.name ?? "").replace(
    /\s+/g,
    "-",
  );

  if (normalizedTitle) return `${sourceSlug}:role:${normalizedTitle}`;

  return `${sourceSlug}:${job.code ?? job.id ?? "unknown"}`;
}

export function playrixDescription(job: PlayrixJob) {
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

export function playrixSearchText(job: PlayrixJob) {
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

export async function fetchPlayrixJobs(
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
