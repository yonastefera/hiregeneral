import type { JobListing } from "@/data/jobPlatform";
import type { Job } from "@/lib/db/types";

export type JobCardJob = JobListing;

export function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
) {
  if (!min && !max) return undefined;

  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;

  return `Up to ${fmt(max!)}`;
}

export function postedDaysAgo(postedAt: string | null | undefined) {
  if (!postedAt) return 0;

  const postedTime = new Date(postedAt).getTime();

  if (Number.isNaN(postedTime)) return 0;

  const days = Math.floor((Date.now() - postedTime) / 86_400_000);

  return Math.max(days, 0);
}

function jobSummary(description: string | null) {
  return description
    ? description.replace(/\s+/g, " ").trim().slice(0, 180)
    : "";
}

export function toJobCardShape(job: Job): JobCardJob {
  return {
    id: job.id,
    slug: job.slug ?? job.id,

    company: job.company_name,
    logo: job.company_logo_url ?? job.company_name.slice(0, 2).toUpperCase(),

    title: job.title,
    location: job.location,
    postedDaysAgo: postedDaysAgo(job.posted_at),
    employmentType: job.employment_type,

    summary: jobSummary(job.description),
    description: job.description ?? "",

    salary: formatSalary(
      job.salary_min,
      job.salary_max,
      job.salary_currency ?? "USD",
    ),

    workMode: job.work_mode,
    distance: 0,

    skills: job.skills ?? [],
    applicants: job.applicant_count ?? 0,

    applyUrl: job.apply_url ?? undefined,

    companyTagline: job.company_tagline ?? "",
    companySize: job.company_size ?? "",
    companyWebsite: job.company_website ?? "",
    experienceLevel: job.experience_level ?? "",
    category: job.category ?? "",

    responsibilities: job.responsibilities ?? [],
    requirements: job.requirements ?? [],
    benefits: job.benefits ?? [],
  };
}
