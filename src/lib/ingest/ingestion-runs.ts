import { createClient } from "@supabase/supabase-js";
import type { JobSource } from "./job-sources";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export type IngestionRunStatus = "running" | "success" | "failed";

export async function getPreviousSuccessfulJobCount(source: JobSource) {
  const { data, error } = await supabaseAdmin
    .from("job_ingestion_runs")
    .select("valid_jobs")
    .eq("source_name", source.sourceType)
    .eq("source_slug", source.sourceSlug)
    .eq("status", "success")
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load previous ingestion run: ${error.message}`);
  }

  return data?.valid_jobs ?? null;
}

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
  attemptCount?: number;
  retryCount?: number;
  deadLettered?: boolean;
  qualityMetrics?: Record<string, unknown>;
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
      attempt_count: values.attemptCount ?? 1,
      retry_count: values.retryCount ?? 0,
      dead_lettered: values.deadLettered ?? false,
      quality_metrics: values.qualityMetrics ?? {},
      error_message: values.errorMessage ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) {
    throw new Error(`Could not update ingestion run: ${error.message}`);
  }
}

export async function recordIngestionDeadLetter(params: {
  runId: string;
  source: JobSource;
  attemptCount: number;
  errorCode: string;
  errorMessage: string;
  context?: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin
    .from("job_ingestion_dead_letters")
    .upsert(
      {
        run_id: params.runId,
        source_name: params.source.sourceType,
        source_slug: params.source.sourceSlug,
        company_name: params.source.companyName,
        attempt_count: params.attemptCount,
        error_code: params.errorCode,
        error_message: params.errorMessage,
        context: params.context ?? {},
        status: "open",
      },
      { onConflict: "run_id" },
    );

  if (error) {
    throw new Error(`Could not record ingestion dead letter: ${error.message}`);
  }
}

export async function resolveIngestionDeadLetters(source: JobSource) {
  const { error } = await supabaseAdmin
    .from("job_ingestion_dead_letters")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("source_name", source.sourceType)
    .eq("source_slug", source.sourceSlug)
    .eq("status", "open");

  if (error) {
    throw new Error(
      `Could not resolve ingestion dead letters: ${error.message}`,
    );
  }
}
