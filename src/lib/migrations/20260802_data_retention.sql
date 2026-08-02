CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION public.prune_stale_operational_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_jobs INTEGER;
  deleted_runs INTEGER;
BEGIN
  DELETE FROM public.jobs AS job
  WHERE job.source_id IS NOT NULL
    AND (
      (
        job.status = 'closed'
        AND job.updated_at < now() - interval '7 days'
      )
      OR job.expires_at < now() - interval '7 days'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.applications AS application
      WHERE application.job_id = job.id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.saved_jobs AS saved
      WHERE saved.job_id = job.id
    );
  GET DIAGNOSTICS deleted_jobs = ROW_COUNT;

  DELETE FROM public.job_ingestion_runs
  WHERE created_at < now() - interval '30 days';
  GET DIAGNOSTICS deleted_runs = ROW_COUNT;

  RETURN jsonb_build_object(
    'deleted_jobs', deleted_jobs,
    'deleted_ingestion_runs', deleted_runs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.prune_stale_operational_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prune_stale_operational_data() TO service_role;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'hiregeneral-data-retention';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'hiregeneral-data-retention',
    '17 4 * * *',
    'SELECT public.prune_stale_operational_data();'
  );
END;
$$;
