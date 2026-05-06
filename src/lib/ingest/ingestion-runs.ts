import { createClient } from "@supabase/supabase-js";
import type { JobSource } from "./job-sources";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export type IngestionRunStatus = "running" | "success" | "failed";

export async function startIngestionRun(source: JobSource) {
  const { data, error } = await supabaseAdmin
    .from("job_ingestion_runs")
    .insert({
      source_name: source.sourceType,
      source_slug: source.sourceSlug,
      company_name: source.companyName,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not create ingestion run: ${error.message}`);
  }

  return data.id as string;
}

export async function finishIngestionRun(params: {
  runId: string;
  status: IngestionRunStatus;
  fetchedJobs: number;
  validJobs: number;
  rejectedJobs: number;
  upsertedJobs: number;
  expiredJobs: number;
  errorMessage?: string | null;
}) {
  const { runId, ...values } = params;

  const { error } = await supabaseAdmin
    .from("job_ingestion_runs")
    .update({
      status: values.status,
      fetched_jobs: values.fetchedJobs,
      valid_jobs: values.validJobs,
      rejected_jobs: values.rejectedJobs,
      upserted_jobs: values.upsertedJobs,
      expired_jobs: values.expiredJobs,
      error_message: values.errorMessage ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) {
    throw new Error(`Could not update ingestion run: ${error.message}`);
  }
}
