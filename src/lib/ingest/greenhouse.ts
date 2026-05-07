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
import type { JobSourceAdapter } from "./source";

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  content?: string;
  updated_at?: string;
  location?: {
    name?: string;
  };
  departments?: Array<{
    name?: string;
  }>;
  offices?: Array<{
    name?: string;
  }>;
};

type GreenhouseResponse = {
  jobs: GreenhouseJob[];
};

function searchableJobText(job: GreenhouseJob) {
  return [
    job.title,
    job.location?.name,
    ...(job.departments ?? []).map((department) => department.name),
    ...(job.offices ?? []).map((office) => office.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isUsJob(job: GreenhouseJob) {
  return isUsText(searchableJobText(job));
}

function isEngineeringJob(job: GreenhouseJob) {
  const departmentText = (job.departments ?? [])
    .map((department) => department.name ?? "")
    .join(" ")
    .toLowerCase();

  if (departmentText.includes("engineering")) return true;

  return isEngineeringText(job.title);
}

function isInternshipJob(job: GreenhouseJob) {
  return isInternshipText(searchableJobText(job));
}

export async function fetchGreenhouseJobs(params: {
  companyName: string;
  companyLogoUrl?: string;
  sourceSlug: string;
}): Promise<ImportedJob[]> {
  const { companyLogoUrl, companyName, sourceSlug } = params;

  const recruiterId = process.env.SYSTEM_RECRUITER_ID;

  if (!recruiterId) {
    throw new Error("Missing SYSTEM_RECRUITER_ID");
  }

  const url = `https://boards-api.greenhouse.io/v1/boards/${sourceSlug}/jobs?content=true`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "YourJobBoard/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Greenhouse fetch failed for ${companyName} (${sourceSlug}): ${response.status}`,
    );
  }

  const data = (await response.json()) as GreenhouseResponse;

  if (!Array.isArray(data.jobs)) {
    throw new Error(`Invalid Greenhouse response for ${companyName}`);
  }

  const filteredJobs = dedupeBySourceKey(
    data.jobs.filter(
      (job) => isUsJob(job) && isEngineeringJob(job) && !isInternshipJob(job),
    ),
    (job) => String(job.id),
  );

  return filteredJobs.map((job) => {
    const location = job.location?.name || "Not specified";
    const plainDescription = htmlToText(job.content);

    return {
      recruiterId,
      companyId: null,
      companyName,
      companyLogoUrl: companyLogoUrl ?? null,
      title: job.title,
      description: safeDescription({
        description: plainDescription,
        title: job.title,
        companyName,
      }),
      location,

      latitude: null,
      longitude: null,

      employmentType: normalizeEmploymentType(null),
      workMode: detectWorkMode(job.title, location),

      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",

      skills: [],
      responsibilities: [],
      requirements: [],
      benefits: [],

      status: "published",

      postedAt: job.updated_at ?? new Date().toISOString(),
      expiresAt: defaultExpiryDate(30),

      sourceName: "greenhouse",
      sourceId: `${sourceSlug}:${job.id}`,
      applyUrl: job.absolute_url,

      experienceLevel: null,
      category: job.departments?.[0]?.name ?? null,

      companyTagline: null,
      companySize: null,
      companyWebsite: null,
    };
  });
}

export const greenhouseAdapter: JobSourceAdapter = {
  type: "greenhouse",
  fetchJobs: fetchGreenhouseJobs,
};
