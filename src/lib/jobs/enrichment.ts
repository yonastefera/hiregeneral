import type { JobEnrichment } from "@/lib/db/types";

type JobEnrichmentRow = {
  job_id: string;
  display_title: string;
  display_location: string;
  location_count: number;
  summary: string;
  about_role: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  quality_flags: string[];
  confidence: number;
  status: "ready" | "failed";
  error_message: string | null;
  model: string;
  prompt_version: string;
  enriched_at: string | null;
};

export const JOB_ENRICHMENT_SELECT = `
  job_id,
  display_title,
  display_location,
  location_count,
  summary,
  about_role,
  responsibilities,
  requirements,
  benefits,
  quality_flags,
  confidence,
  status,
  error_message,
  model,
  prompt_version,
  enriched_at
`;

export function mapJobEnrichment(
  row: JobEnrichmentRow | null | undefined,
): JobEnrichment | null {
  if (!row || row.status !== "ready") return null;

  return {
    job_id: row.job_id,
    display_title: row.display_title,
    display_location: row.display_location,
    location_count: row.location_count,
    summary: row.summary,
    about_role: row.about_role,
    responsibilities: row.responsibilities ?? [],
    requirements: row.requirements ?? [],
    benefits: row.benefits ?? [],
    quality_flags: row.quality_flags ?? [],
    confidence: Number(row.confidence ?? 0),
    status: row.status,
    error_message: row.error_message,
    model: row.model,
    prompt_version: row.prompt_version,
    enriched_at: row.enriched_at,
  };
}

export function mapJobEnrichments(rows: JobEnrichmentRow[]) {
  return new Map(
    rows
      .map((row) => [row.job_id, mapJobEnrichment(row)] as const)
      .filter((entry): entry is readonly [string, JobEnrichment] =>
        Boolean(entry[1]),
      ),
  );
}
