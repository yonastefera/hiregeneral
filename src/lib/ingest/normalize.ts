import { z } from "zod";
import { htmlToText } from "@/lib/text/html";

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Expected a valid date string",
  });

export const importedJobSchema = z.object({
  recruiterId: z.uuid(),

  companyId: z.uuid().nullable(),
  companyName: z.string().trim().min(1),
  companyLogoUrl: z.url().nullable(),

  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  location: z.string().trim().min(1),

  latitude: z.number().nullable(),
  longitude: z.number().nullable(),

  employmentType: z.string().trim().min(1),
  workMode: z.string().trim().min(1),

  salaryMin: z.number().int().nonnegative().nullable(),
  salaryMax: z.number().int().nonnegative().nullable(),
  salaryCurrency: z.string().trim().min(3).max(3),

  skills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  requirements: z.array(z.string()),
  benefits: z.array(z.string()),

  status: z.literal("published"),

  postedAt: isoDateString,
  expiresAt: isoDateString.nullable(),

  sourceName: z.string().trim().min(1),
  sourceId: z.string().trim().min(1),
  applyUrl: z.url(),

  experienceLevel: z.string().nullable(),
  category: z.string().nullable(),

  companyTagline: z.string().nullable(),
  companySize: z.string().nullable(),
  companyWebsite: z.url().nullable(),
});

export type ImportedJob = z.infer<typeof importedJobSchema>;

export { htmlToText };

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function importedJobSlug(
  job: Pick<ImportedJob, "companyName" | "title" | "sourceName" | "sourceId">,
) {
  const readable = slugify(`${job.companyName}-${job.title}`);
  const source = slugify(`${job.sourceName}-${job.sourceId}`);

  return [readable, source].filter(Boolean).join("-");
}

export function detectWorkMode(title: string, location: string) {
  const value = `${title} ${location}`.toLowerCase();

  if (
    value.includes("remote") ||
    value.includes("anywhere") ||
    value.includes("work from home")
  ) {
    return "Remote";
  }

  if (value.includes("hybrid")) {
    return "Hybrid";
  }

  return "On-site";
}

export function normalizeEmploymentType(value?: string | null) {
  if (!value) return "Full-time";

  const lower = value.toLowerCase();

  if (lower.includes("part")) return "Part-time";
  if (lower.includes("contract")) return "Contract";
  if (lower.includes("intern")) return "Internship";
  if (lower.includes("temporary")) return "Temporary";
  if (lower.includes("freelance")) return "Contract";

  return "Full-time";
}

export function defaultExpiryDate(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function safeDescription(params: {
  description?: string | null;
  title: string;
  companyName: string;
}) {
  const description = htmlToText(params.description).trim();

  if (description) return description;

  return `${params.title} role at ${params.companyName}.`;
}
