import type { Job } from "@/lib/db/types";
import { isSupportedLogoUrl } from "@/lib/logos";
import { htmlToText, cleanTextArray } from "@/lib/text/html";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

export const APPLICATION_STEPS = [
  { id: 1, title: "Your details", description: "Contact information" },
  { id: 2, title: "Resume", description: "Upload your CV" },
  { id: 3, title: "Questions", description: "A few quick questions" },
  { id: 4, title: "Review", description: "Confirm and submit" },
] as const;

export type ApplicationStep = (typeof APPLICATION_STEPS)[number]["id"];

export type ApplyFormValues = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  coverNote: string;
  yearsExp: string;
  workAuth: string;
  requireSponsorship: string;
  agree: boolean;
};

export type ApplyFormErrors = Partial<
  Record<
    | "fullName"
    | "email"
    | "resume"
    | "yearsExp"
    | "workAuth"
    | "agree"
    | "form",
    string
  >
>;

export function formatSalary(
  min: number | null,
  max: number | null,
  currency = "USD",
) {
  if (!min && !max) return null;

  const fmt = (n: number) =>
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;

  return `Up to ${fmt(max!)}`;
}

export function supportedLogoUrl(value: string | null | undefined) {
  return value && isSupportedLogoUrl(value) ? value : null;
}

export function cleanJob(job: Job): Job {
  return {
    ...job,
    title: htmlToText(job.title),
    description: htmlToText(job.description),
    company_tagline: job.company_tagline
      ? htmlToText(job.company_tagline)
      : job.company_tagline,
    responsibilities: cleanTextArray(job.responsibilities),
    requirements: cleanTextArray(job.requirements),
    benefits: cleanTextArray(job.benefits),
    skills: job.skills ?? [],
  };
}

export function getJobTitle(job: Job) {
  return job.enrichment?.display_title ?? job.title;
}

export function getJobApplyPath(job: Job) {
  return `/jobs/${job.slug ?? job.id}/apply`;
}

export function getJobDetailsPath(job: Job) {
  return `/jobs/${job.slug ?? job.id}`;
}

export function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();

  return extension ? `.${extension.toLowerCase()}` : "";
}

export function isAcceptedResumeFile(file: File) {
  const extension = getFileExtension(file.name);

  return ACCEPTED_RESUME_EXTENSIONS.includes(
    extension as (typeof ACCEPTED_RESUME_EXTENSIONS)[number],
  );
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getFileSizeLabel(file: File | null) {
  if (!file) return null;

  const kb = file.size / 1024;

  return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(0)} KB`;
}

export function validateApplyStep({
  step,
  values,
  file,
}: {
  step: ApplicationStep;
  values: ApplyFormValues;
  file: File | null;
}) {
  const errors: ApplyFormErrors = {};

  if (step === 1) {
    if (!values.fullName.trim()) {
      errors.fullName = "Enter your full name.";
    }

    if (!values.email.trim()) {
      errors.email = "Enter your email address.";
    } else if (!isValidEmail(values.email)) {
      errors.email = "Enter a valid email address.";
    }
  }

  if (step === 2) {
    if (!file) {
      errors.resume = "Attach your resume to continue.";
    }
  }

  if (step === 3) {
    if (!values.yearsExp) {
      errors.yearsExp = "Select your years of experience.";
    }

    if (!values.workAuth) {
      errors.workAuth = "Select your work authorization.";
    }
  }

  if (step === 4) {
    if (!values.agree) {
      errors.agree = "Confirm that your information is accurate.";
    }
  }

  return errors;
}
