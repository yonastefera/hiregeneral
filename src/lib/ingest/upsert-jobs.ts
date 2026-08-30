import { createClient } from "@supabase/supabase-js";
import { importedJobSlug, type ImportedJob } from "./normalize";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const STAGING_CHUNK_SIZE = 500;

function sourceIdPrefix(sourceSlug: string) {
  return `${sourceSlug}:%`;
}

export async function getPublishedImportedJobCount(params: {
  sourceName: string;
  sourceSlug: string;
}) {
  const { count, error } = await supabaseAdmin
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("source_name", params.sourceName)
    .like("source_id", sourceIdPrefix(params.sourceSlug))
    .eq("status", "published");

  if (error) {
    throw new Error(`Supabase imported job count failed: ${error.message}`);
  }

  return count ?? 0;
}

function stagedPayload(job: ImportedJob) {
  return {
    ...job,
    slug: importedJobSlug(job),
  };
}

export async function stageImportedJobs(params: {
  runId: string;
  sourceName: string;
  sourceSlug: string;
  jobs: ImportedJob[];
}) {
  const { error: clearError } = await supabaseAdmin
    .from("job_ingestion_staging")
    .delete()
    .eq("run_id", params.runId);

  if (clearError) {
    throw new Error(`Supabase staging cleanup failed: ${clearError.message}`);
  }

  if (params.jobs.length === 0) return { staged: 0 };

  const rows = params.jobs.map((job) => ({
    run_id: params.runId,
    source_name: params.sourceName,
    source_slug: params.sourceSlug,
    source_id: job.sourceId,
    payload: stagedPayload(job),
  }));
  for (let index = 0; index < rows.length; index += STAGING_CHUNK_SIZE) {
    const { error } = await supabaseAdmin
      .from("job_ingestion_staging")
      .insert(rows.slice(index, index + STAGING_CHUNK_SIZE));

    if (error) {
      throw new Error(`Supabase staging failed: ${error.message}`);
    }
  }

  return { staged: rows.length };
}

export async function publishStagedImportedJobs(params: {
  runId: string;
  expireStale: boolean;
}) {
  const { data, error } = await supabaseAdmin.rpc(
    "publish_job_ingestion_stage",
    {
      p_run_id: params.runId,
      p_expire_stale: params.expireStale,
    },
  );

  if (error) {
    throw new Error(`Supabase atomic publish failed: ${error.message}`);
  }

  const { error: enrichmentError } = await supabaseAdmin.rpc(
    "process_job_knowledge_queue",
    { p_limit: 500 },
  );
  if (enrichmentError && enrichmentError.code !== "PGRST202") {
    console.error(
      `[job knowledge enrichment] ${enrichmentError.code ?? "unknown_error"}`,
    );
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    upserted: Number(result?.upserted_jobs ?? 0),
    expired: Number(result?.expired_jobs ?? 0),
  };
}
