import { createClient } from "@supabase/supabase-js";
import { importedJobSlug, type ImportedJob } from "./normalize";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const STALE_UPDATE_CHUNK_SIZE = 100;

function sourceIdPrefix(sourceSlug: string) {
  return `${sourceSlug}:%`;
}

export async function upsertImportedJobs(jobs: ImportedJob[]) {
  if (jobs.length === 0) {
    return {
      upserted: 0,
    };
  }

  const rows = jobs.map((job) => ({
    recruiter_id: job.recruiterId,

    company_id: job.companyId,
    company_name: job.companyName,
    company_logo_url: job.companyLogoUrl,

    title: job.title,
    slug: importedJobSlug(job),
    description: job.description,
    location: job.location,

    latitude: job.latitude,
    longitude: job.longitude,

    employment_type: job.employmentType,
    work_mode: job.workMode,

    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    salary_currency: job.salaryCurrency,

    skills: job.skills,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    benefits: job.benefits,

    status: job.status,

    posted_at: job.postedAt,
    expires_at: job.expiresAt,

    source_name: job.sourceName,
    source_id: job.sourceId,
    apply_url: job.applyUrl,

    experience_level: job.experienceLevel,
    category: job.category,

    company_tagline: job.companyTagline,
    company_size: job.companySize,
    company_website: job.companyWebsite,
  }));

  const { error } = await supabaseAdmin.from("jobs").upsert(rows, {
    onConflict: "source_name,source_id",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  return {
    upserted: rows.length,
  };
}

export async function expireStaleImportedJobs(params: {
  sourceName: string;
  sourceSlug: string;
  activeSourceIds: string[];
}) {
  const { sourceName, sourceSlug, activeSourceIds } = params;
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("id, source_id")
    .eq("source_name", sourceName)
    .like("source_id", sourceIdPrefix(sourceSlug))
    .eq("status", "published");

  if (error) {
    throw new Error(`Supabase stale job lookup failed: ${error.message}`);
  }

  const active = new Set(activeSourceIds);
  const staleIds = (data ?? [])
    .filter((job) => job.source_id && !active.has(job.source_id))
    .map((job) => job.id as string);

  for (let i = 0; i < staleIds.length; i += STALE_UPDATE_CHUNK_SIZE) {
    const ids = staleIds.slice(i, i + STALE_UPDATE_CHUNK_SIZE);

    const { error: updateError } = await supabaseAdmin
      .from("jobs")
      .update({
        status: "closed",
        expires_at: now,
      })
      .in("id", ids);

    if (updateError) {
      throw new Error(
        `Supabase stale job update failed: ${updateError.message}`,
      );
    }
  }

  return {
    expired: staleIds.length,
  };
}
