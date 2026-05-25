import {
  Code2,
  Crosshair,
  Database,
  Heart,
  Megaphone,
  PaintBucket,
} from "lucide-react";

import type { JobCardJob } from "@/lib/jobs/card-shape";
import type { HomeMarketCategory } from "./home-insights";

export type HomeJob = JobCardJob & Record<string, unknown>;

export const categoryStyles: Record<
  HomeMarketCategory["icon"],
  {
    icon: typeof Code2;
    accent: string;
    iconColor: string;
  }
> = {
  engineering: {
    icon: Code2,
    accent: "from-emerald-100 to-teal-100",
    iconColor: "text-emerald-700",
  },
  design: {
    icon: PaintBucket,
    accent: "from-rose-100 to-pink-100",
    iconColor: "text-rose-700",
  },
  data: {
    icon: Database,
    accent: "from-violet-100 to-indigo-100",
    iconColor: "text-violet-700",
  },
  marketing: {
    icon: Megaphone,
    accent: "from-amber-100 to-orange-100",
    iconColor: "text-amber-700",
  },
  operations: {
    icon: Crosshair,
    accent: "from-sky-100 to-cyan-100",
    iconColor: "text-sky-700",
  },
  healthcare: {
    icon: Heart,
    accent: "from-fuchsia-100 to-pink-100",
    iconColor: "text-fuchsia-700",
  },
};

export const jobAccents = [
  "from-violet-500 to-indigo-500",
  "from-sky-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-teal-500",
];

export function getJobCompany(job: HomeJob) {
  if (typeof job.companyName === "string") return job.companyName;
  if (typeof job.company === "string") return job.company;

  const companyValue = (job as Record<string, unknown>).company;
  if (
    companyValue &&
    typeof companyValue === "object" &&
    "name" in companyValue &&
    typeof companyValue.name === "string"
  ) {
    return companyValue.name;
  }

  if (typeof job.employerName === "string") return job.employerName;
  if (typeof job.organization === "string") return job.organization;

  return "Company";
}

export function getJobTitle(job: HomeJob) {
  if (typeof job.title === "string") return job.title;
  if (typeof job.name === "string") return job.name;
  if (typeof job.position === "string") return job.position;

  return "Open role";
}

export function getJobLocation(job: HomeJob) {
  if (typeof job.location === "string") return job.location;

  const city = typeof job.city === "string" ? job.city : "";
  const state = typeof job.state === "string" ? job.state : "";

  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;

  if (job.remote === true) return "Remote";
  if (typeof job.workplace === "string") return job.workplace;

  return "Remote";
}

export function getJobType(job: HomeJob) {
  if (typeof job.employmentType === "string") return job.employmentType;
  if (typeof job.type === "string") return job.type;
  if (typeof job.jobType === "string") return job.jobType;

  return "Full-time";
}

export function getJobMode(job: HomeJob) {
  if (typeof job.mode === "string") return job.mode;
  if (typeof job.workMode === "string") return job.workMode;
  if (typeof job.workplaceType === "string") return job.workplaceType;
  if (job.remote === true) return "Remote";

  return "";
}

export function getJobPosted(job: HomeJob) {
  if (typeof job.postedAtLabel === "string") return job.postedAtLabel;
  if (typeof job.posted === "string") return job.posted;
  if (typeof job.postedLabel === "string") return job.postedLabel;
  if (typeof job.createdAtLabel === "string") return job.createdAtLabel;

  return "Recently posted";
}

export function getJobSalary(job: HomeJob) {
  const directSalary =
    cleanText(job.salary) ||
    cleanText(job.salaryRange) ||
    cleanText(job.compensation) ||
    cleanText(job.payRange);

  if (directSalary && !/^salary listed$/i.test(directSalary)) {
    return directSalary;
  }

  const min =
    typeof job.salaryMin === "number"
      ? job.salaryMin
      : typeof job.minSalary === "number"
        ? job.minSalary
        : null;

  const max =
    typeof job.salaryMax === "number"
      ? job.salaryMax
      : typeof job.maxSalary === "number"
        ? job.maxSalary
        : null;

  if (min && max) {
    return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
  }

  return "";
}

export function getJobTags(job: HomeJob) {
  if (Array.isArray(job.tags)) {
    return job.tags.filter(Boolean).slice(0, 4);
  }

  if (Array.isArray(job.skills)) {
    return job.skills.filter(Boolean).slice(0, 4);
  }

  return [getJobType(job), getJobMode(job)].filter(Boolean).slice(0, 4);
}

export function getJobHref(job: HomeJob) {
  return `/jobs/${job.id}`;
}

export function getCompanyInitials(company: string) {
  return company.slice(0, 2).toUpperCase();
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
