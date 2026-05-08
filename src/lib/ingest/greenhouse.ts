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
import type { JobSourceAdapter } from "./source";

const MAX_GREENHOUSE_JOBS_PER_SOURCE = 100;

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

function searchableJobLocationText(job: GreenhouseJob) {
  return [
    job.location?.name,
    ...(job.offices ?? []).map((office) => office.name),
  ]
    .filter(Boolean)
    .join(" ");
}

function searchableJobText(job: GreenhouseJob) {
  return [
    job.title,
    job.location?.name,
    ...(job.departments ?? []).map((department) => department.name),
    ...(job.offices ?? []).map((office) => office.name),
    job.content,
  ]
    .filter(Boolean)
    .join(" ");
}

function isUsJob(job: GreenhouseJob) {
  return isUsText(searchableJobLocationText(job));
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

function greenhouseLocations(job: GreenhouseJob) {
  return [
    job.location?.name,
    ...(job.offices ?? []).map((office) => office.name),
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim())
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

function duplicateRoleKey(sourceSlug: string, job: GreenhouseJob) {
  const normalizedTitle = normalizedJobTitleKey(job.title);

  return normalizedTitle
    ? `${sourceSlug}:${normalizedTitle}`
    : `${sourceSlug}:${job.id}`;
}

function duplicateRoleSourceId(sourceSlug: string, job: GreenhouseJob) {
  const normalizedTitle = normalizedJobTitleKey(job.title).replace(/\s+/g, "-");

  return normalizedTitle
    ? `${sourceSlug}:role:${normalizedTitle}`
    : `${sourceSlug}:${job.id}`;
}

function mergeDuplicateGreenhouseRoles(
  sourceSlug: string,
  jobs: GreenhouseJob[],
) {
  const grouped = new Map<
    string,
    {
      job: GreenhouseJob;
      sourceId: string;
      locations: string[];
    }
  >();

  for (const job of jobs) {
    const key = duplicateRoleKey(sourceSlug, job);
    const locations = greenhouseLocations(job);
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        job,
        sourceId: duplicateRoleSourceId(sourceSlug, job),
        locations: locations.length > 0 ? locations : ["United States"],
      });
      continue;
    }

    current.locations = uniqueItems([
      ...current.locations,
      ...(locations.length > 0 ? locations : ["United States"]),
    ]);
  }

  return [...grouped.values()].map((item) => ({
    ...item,
    location: item.locations.join(", "),
  }));
}

export async function fetchGreenhouseJobs(params: {
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

  const url = `https://boards-api.greenhouse.io/v1/boards/${sourceSlug}/jobs?content=true`;

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
      `Greenhouse fetch failed for ${companyName} (${sourceSlug}): ${response.status}`,
    );
  }

  const data = (await response.json()) as GreenhouseResponse;

  if (!Array.isArray(data.jobs)) {
    throw new Error(`Invalid Greenhouse response for ${companyName}`);
  }

  const filteredJobs = mergeDuplicateGreenhouseRoles(
    sourceSlug,
    data.jobs
      .filter(
        (job) => isUsJob(job) && isEngineeringJob(job) && !isInternshipJob(job),
      )
      .slice(0, MAX_GREENHOUSE_JOBS_PER_SOURCE),
  );

  return filteredJobs.map(({ job, location, sourceId }) => {
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
      sourceId,
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
  fetchJobs: (source, context) =>
    fetchGreenhouseJobs({
      companyName: source.companyName,
      companyLogoUrl: source.companyLogoUrl,
      sourceSlug: source.sourceSlug,
      signal: context?.signal,
    }),
};
