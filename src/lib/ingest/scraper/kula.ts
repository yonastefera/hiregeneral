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
  decodeHtml,
  metadataString,
  recordNumber,
  uniqueItems,
} from "./shared";

export type KulaJob = {
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
    job_description?: string | null;
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

export function balancedJsonObjects(value: string, marker: string) {
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

export function kulaJobsFromHtml(html: string) {
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

export function kulaLocation(job: KulaJob) {
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

export function kulaLocationSearchText(job: KulaJob) {
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

export function kulaApplyUrl(source: JobSource, job: KulaJob) {
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

export function kulaJobDescription(job: KulaJob) {
  const description = job.ats_job?.job_description?.trim();

  if (!description || /^\$[0-9a-f]+$/i.test(description)) return "";

  return description;
}

export async function fetchKulaJobs(
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
    const detailDescription = kulaJobDescription(job);
    const description = safeDescription({
      title,
      companyName: source.companyName,
      description:
        detailDescription ||
        `${title} role on ${source.companyName}'s ${department} team. Visit the company careers site for the complete description and application details.`,
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
