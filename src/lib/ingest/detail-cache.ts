import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ImportedJob } from "./normalize";

const DEFAULT_REFRESH_DAYS = 7;

type CachedDetail = Pick<
  ImportedJob,
  | "description"
  | "employmentType"
  | "salaryMin"
  | "salaryMax"
  | "responsibilities"
  | "requirements"
  | "benefits"
  | "skills"
  | "postedAt"
>;

type CacheRow = {
  listing_fingerprint: string;
  detail_payload: CachedDetail;
  refreshed_at: string;
};

let client: SupabaseClient | null = null;

function adminClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function refreshMilliseconds() {
  const configured = Number(process.env.INGEST_DETAIL_REFRESH_DAYS);
  const days =
    Number.isFinite(configured) && configured > 0
      ? Math.min(configured, 30)
      : DEFAULT_REFRESH_DAYS;
  return days * 24 * 60 * 60 * 1_000;
}

export function listingFingerprint(job: ImportedJob, detailUrl: string) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        sourceId: job.sourceId,
        title: job.title,
        description: job.description,
        location: job.location,
        employmentType: job.employmentType,
        workMode: job.workMode,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        postedAt: job.postedAt,
        applyUrl: job.applyUrl,
        detailUrl,
      }),
    )
    .digest("hex");
}

function detailPayload(job: ImportedJob): CachedDetail {
  return {
    description: job.description,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    benefits: job.benefits,
    skills: job.skills,
    postedAt: job.postedAt,
  };
}

export async function readCachedJobDetail(job: ImportedJob, detailUrl: string) {
  const supabase = adminClient();
  if (!supabase) return null;

  const fingerprint = listingFingerprint(job, detailUrl);
  const { data, error } = await supabase
    .from("job_detail_cache")
    .select("listing_fingerprint, detail_payload, refreshed_at")
    .eq("source_name", job.sourceName)
    .eq("source_id", job.sourceId)
    .maybeSingle<CacheRow>();

  if (error || !data || data.listing_fingerprint !== fingerprint) return null;
  if (Date.now() - Date.parse(data.refreshed_at) > refreshMilliseconds()) {
    return null;
  }

  return { ...job, ...data.detail_payload };
}

export async function writeCachedJobDetail(
  listingJob: ImportedJob,
  detailUrl: string,
  enrichedJob: ImportedJob,
) {
  const supabase = adminClient();
  if (!supabase) return;

  await supabase.from("job_detail_cache").upsert(
    {
      source_name: listingJob.sourceName,
      source_id: listingJob.sourceId,
      detail_url: detailUrl,
      listing_fingerprint: listingFingerprint(listingJob, detailUrl),
      detail_payload: detailPayload(enrichedJob),
      refreshed_at: new Date().toISOString(),
    },
    { onConflict: "source_name,source_id" },
  );
}
