CREATE OR REPLACE FUNCTION public.get_job_ingestion_source_schedule()
RETURNS TABLE (
  source_name TEXT,
  source_slug TEXT,
  last_attempt_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    runs.source_name,
    runs.source_slug,
    max(runs.started_at) AS last_attempt_at
  FROM public.job_ingestion_runs AS runs
  GROUP BY runs.source_name, runs.source_slug;
$$;

REVOKE ALL ON FUNCTION public.get_job_ingestion_source_schedule()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_ingestion_source_schedule()
  TO service_role;
