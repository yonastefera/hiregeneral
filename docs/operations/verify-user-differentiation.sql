-- Read-only Phase 3 verification. Every returned value should be true.
SELECT
  to_regclass('public.saved_searches') IS NOT NULL
    AS saved_searches_present,
  to_regclass('public.saved_search_alert_jobs') IS NOT NULL
    AS alert_history_present,
  to_regclass('public.application_status_events') IS NOT NULL
    AS application_timeline_present,
  to_regprocedure(
    'public.employer_update_application_status(uuid,text,text)'
  ) IS NOT NULL AS employer_status_function_present,
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_saved_searches_due_alerts'
  ) AS due_alert_index_present,
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_application_status_events_timeline'
  ) AS application_timeline_index_present,
  EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'record_initial_application_status'
      AND NOT tgisinternal
  ) AS initial_status_trigger_present,
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'saved_searches'
      AND policyname = 'Users manage their saved searches'
  ) AS saved_search_ownership_policy_present,
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'application_status_events'
      AND policyname = 'Application participants can view status events'
  ) AS application_timeline_policy_present,
  NOT has_table_privilege(
    'authenticated',
    'public.application_status_events',
    'INSERT'
  ) AS direct_timeline_insert_revoked;
