import type { Job } from "@/lib/db/types";
import {
  compactText,
  getDisplayTitle,
} from "@/job-seekers/job/details/job-details-utils";
import { getCanonicalJobUrl } from "./site";

const EMPLOYMENT_TYPES: Record<string, string> = {
  "full time": "FULL_TIME",
  fulltime: "FULL_TIME",
  "part time": "PART_TIME",
  parttime: "PART_TIME",
  contract: "CONTRACTOR",
  contractor: "CONTRACTOR",
  temporary: "TEMPORARY",
  temp: "TEMPORARY",
  intern: "INTERN",
  internship: "INTERN",
  volunteer: "VOLUNTEER",
  per_diem: "PER_DIEM",
  "per diem": "PER_DIEM",
  other: "OTHER",
};

function normalizeEmploymentType(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[-_]+/g, " ");
  return (
    EMPLOYMENT_TYPES[normalized] ?? value.toUpperCase().replace(/\W+/g, "_")
  );
}

export function isIndexableJob(job: Job, now = new Date()) {
  return (
    job.status === "published" &&
    (!job.expires_at || Date.parse(job.expires_at) > now.getTime())
  );
}

export function buildJobPostingSchema(job: Job) {
  const isRemote = job.work_mode.trim().toLowerCase() === "remote";

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: getDisplayTitle(job),
    description: compactText(job.description),
    datePosted: job.posted_at,
    validThrough: job.expires_at ?? undefined,
    employmentType: normalizeEmploymentType(job.employment_type),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name,
      sameAs: job.company_website ?? undefined,
      logo: job.company_logo_url ?? undefined,
    },
    jobLocation: isRemote
      ? undefined
      : {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location,
          },
        },
    jobLocationType: isRemote ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: isRemote
      ? {
          "@type": "Country",
          name: "United States",
        }
      : undefined,
    baseSalary:
      job.salary_min !== null || job.salary_max !== null
        ? {
            "@type": "MonetaryAmount",
            currency: job.salary_currency || "USD",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary_min ?? undefined,
              maxValue: job.salary_max ?? undefined,
              unitText: "YEAR",
            },
          }
        : undefined,
    directApply: !job.apply_url,
    url: getCanonicalJobUrl(job),
  };
}
