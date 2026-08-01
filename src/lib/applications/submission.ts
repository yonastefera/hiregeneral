import { z } from "zod";

const optionalTrimmedString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .nullable()
    .transform((value) => value || null);

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((value) => value || null)
  .refine(
    (value) => value === null || isHttpUrl(value),
    "Enter a valid web address.",
  );

export const applicationSubmissionSchema = z
  .object({
    job_id: z.string().uuid(),
    resume_url: z.string().trim().min(1).max(500),
    cover_note: optionalTrimmedString(5_000),
    applicant_full_name: z.string().trim().min(2).max(120),
    applicant_email: z.string().trim().email().max(180),
    applicant_phone: optionalTrimmedString(40),
    applicant_location: optionalTrimmedString(160),
    applicant_linkedin: optionalUrl,
    applicant_portfolio: optionalUrl,
    years_experience: z.enum(["0-1", "2-4", "5-7", "8+"]),
    work_authorization: z.enum(["citizen", "permanent", "visa", "other"]),
    requires_sponsorship: z.enum(["no", "yes", "future"]).default("no"),
  })
  .strict();

export type ApplicationSubmission = z.infer<typeof applicationSubmissionSchema>;

const resumeFileNamePattern =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}\.(pdf|doc|docx)$/i;

export function getOwnedResumeFileName(resumePath: string, userId: string) {
  const parts = resumePath.split("/");

  if (
    parts.length !== 2 ||
    parts[0] !== userId ||
    !resumeFileNamePattern.test(parts[1])
  ) {
    return null;
  }

  return parts[1];
}

export function isJobAcceptingApplications(job: {
  status: string;
  expires_at: string | null;
}) {
  if (job.status !== "published") return false;
  if (!job.expires_at) return true;

  const expiry = Date.parse(job.expires_at);

  return Number.isFinite(expiry) && expiry > Date.now();
}
