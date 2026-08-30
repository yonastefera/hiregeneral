-- Read-only Phase 4.1 verification. Every returned value should be true.
SELECT
  to_regclass('public.employer_pipeline_stages') IS NOT NULL
    AS pipeline_stages_present,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND column_name = 'pipeline_stage_id'
  ) AS application_stage_column_present,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'application_status_events'
      AND column_name = 'stage_name'
  ) AS timeline_stage_name_present,
  to_regprocedure('public.employer_replace_pipeline_stages(jsonb)') IS NOT NULL
    AS replace_pipeline_function_present,
  to_regprocedure(
    'public.employer_move_application_to_stage(uuid,uuid,text)'
  ) IS NOT NULL AS move_candidate_function_present,
  EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'ensure_default_employer_pipeline'
      AND NOT tgisinternal
  ) AS default_pipeline_trigger_present,
  EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'protect_application_pipeline_stage'
      AND NOT tgisinternal
  ) AS protected_stage_change_trigger_present,
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'employer_pipeline_stages'
      AND policyname = 'Employers manage their pipeline stages'
  ) AS pipeline_ownership_policy_present;
