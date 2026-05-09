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
  normalizedJobTitleKey,
} from "./filters";
import type { JobSourceAdapter } from "./source";

type LeverPosting = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  description?: string;
  descriptionPlain?: string;
  createdAt?: number;
  categories?: {
    team?: string;
    department?: string;
    location?: string;
    commitment?: string;
  };
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
};

function getLeverLocation(job: LeverPosting) {
  return job.categories?.location || "Not specified";
}

function getLeverDescription(job: LeverPosting) {
  return job.descriptionPlain || htmlToText(job.description);
}

function getLeverSearchText(job: LeverPosting) {
  return [
    job.text,
    job.categories?.department,
    job.categories?.team,
    getLeverLocation(job),
    getLeverDescription(job),
  ]
    .filter(Boolean)
    .join(" ");
}

function getLeverDedupeKey(job: LeverPosting) {
  return `${normalizedJobTitleKey(job.text)}:${getLeverLocation(job).toLowerCase()}`;
}

export async function fetchLeverJobs(params: {
  companyName: string;
  companyLogoUrl?: string;
  sourceSlug: string;
  signal?: AbortSignal;
}): Promise<ImportedJob[]> {
  const { companyLogoUrl, companyName, signal, sourceSlug } = params;

  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const url = `https://api.lever.co/v0/postings/${sourceSlug}?mode=json`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "YourJobBoard/1.0",
    },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Lever fetch failed for ${companyName} (${sourceSlug}): ${response.status}`,
    );
  }

  const jobs = (await response.json()) as LeverPosting[];

  if (!Array.isArray(jobs)) {
    throw new Error(`Invalid Lever response for ${companyName}`);
  }

  const filteredJobs = dedupeBySourceKey(
    jobs.filter((job) => {
      const location = getLeverLocation(job);
      const searchText = getLeverSearchText(job);

      return (
        isUsText(location) &&
        isEngineeringText(searchText) &&
        !isInternshipText(searchText)
      );
    }),
    getLeverDedupeKey,
  );

  return filteredJobs.map((job) => {
    const location = getLeverLocation(job);
    const plainDescription = getLeverDescription(job);

    const applyUrl = job.applyUrl || job.hostedUrl;

    return {
      recruiterId,

      companyId: null,
      companyName,
      companyLogoUrl: companyLogoUrl ?? null,

      title: job.text,
      description: safeDescription({
        description: plainDescription,
        title: job.text,
        companyName,
      }),
      location,

      latitude: null,
      longitude: null,

      employmentType: normalizeEmploymentType(job.categories?.commitment),
      workMode: detectWorkMode(job.text, location),

      salaryMin: job.salaryRange?.min ?? null,
      salaryMax: job.salaryRange?.max ?? null,
      salaryCurrency: job.salaryRange?.currency ?? "USD",

      skills: [],
      responsibilities: [],
      requirements: [],
      benefits: [],

      status: "published",

      postedAt: job.createdAt
        ? new Date(job.createdAt).toISOString()
        : new Date().toISOString(),
      expiresAt: defaultExpiryDate(30),

      sourceName: "lever",
      sourceId: `${sourceSlug}:${job.id}`,
      applyUrl,

      experienceLevel: null,
      category: job.categories?.department ?? job.categories?.team ?? null,

      companyTagline: null,
      companySize: null,
      companyWebsite: null,
    };
  });
}

export const leverAdapter: JobSourceAdapter = {
  type: "lever",
  fetchJobs: (source, context) =>
    fetchLeverJobs({
      companyName: source.companyName,
      companyLogoUrl: source.companyLogoUrl,
      sourceSlug: source.sourceSlug,
      signal: context?.signal,
    }),
};
