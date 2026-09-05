const DESCRIPTION_PREVIEW_LENGTH = 480;

export type JobCardEnrichmentRow = {
  job_id: string;
  display_title: string;
  display_location: string;
  summary: string;
};

type JobCardSource = {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  company_tagline: string | null;
  company_size: string | null;
  company_website: string | null;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  work_mode: string;
  experience_level: string | null;
  category: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  skills: string[];
  slug: string | null;
  source_name: string | null;
  apply_url: string | null;
  posted_at: string;
  applicant_count?: number;
};

function stripHtml(input: string | null | undefined) {
  if (!input) return "";

  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function textPreview(value: string | null | undefined) {
  const text = stripHtml(value);
  if (text.length <= DESCRIPTION_PREVIEW_LENGTH) return text;

  const shortened = text.slice(0, DESCRIPTION_PREVIEW_LENGTH + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  const end =
    lastSpace >= DESCRIPTION_PREVIEW_LENGTH * 0.75
      ? lastSpace
      : DESCRIPTION_PREVIEW_LENGTH;

  return `${shortened.slice(0, end).trimEnd()}…`;
}

export function toCompactJobListItem(
  job: JobCardSource,
  enrichment?: JobCardEnrichmentRow,
) {
  return {
    id: job.id,
    company_name: job.company_name,
    company_logo_url: job.company_logo_url,
    company_tagline: job.company_tagline,
    company_size: job.company_size,
    company_website: job.company_website,
    title: job.title,
    description: textPreview(job.description),
    location: job.location,
    employment_type: job.employment_type,
    work_mode: job.work_mode,
    experience_level: job.experience_level,
    category: job.category,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_currency: job.salary_currency,
    skills: job.skills,
    slug: job.slug,
    source_name: job.source_name,
    apply_url: job.apply_url,
    posted_at: job.posted_at,
    applicant_count: job.applicant_count ?? 0,
    enrichment: enrichment
      ? {
          display_title: enrichment.display_title,
          display_location: enrichment.display_location,
          summary: textPreview(enrichment.summary),
        }
      : null,
  };
}
