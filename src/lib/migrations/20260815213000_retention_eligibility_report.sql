-- Report records eligible for retention cleanup without deleting any data.
-- Destructive cleanup remains disabled pending legal approval and volume review.

CREATE OR REPLACE FUNCTION public.retention_eligibility_report()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'generated_at', now(),
    'report_only', true,
    'pending_accounts_ready', (
      SELECT count(*)
      FROM public.profiles
      WHERE deletion_requested_at <= now() - interval '14 days'
        AND deleted_at IS NULL
    ),
    'contact_messages_older_than_12_months', (
      SELECT count(*)
      FROM public.contact_messages
      WHERE created_at < now() - interval '12 months'
    ),
    'read_notifications_older_than_180_days', (
      SELECT count(*)
      FROM public.notifications
      WHERE read_at IS NOT NULL
        AND created_at < now() - interval '180 days'
    ),
    'closed_applications_inactive_24_months', (
      SELECT count(*)
      FROM public.applications AS application
      JOIN public.jobs AS job ON job.id = application.job_id
      WHERE job.status = 'closed'
        AND greatest(application.updated_at, job.updated_at)
          < now() - interval '24 months'
    ),
    'conversations_inactive_24_months', (
      SELECT count(*)
      FROM public.conversations
      WHERE last_message_at < now() - interval '24 months'
    ),
    'security_audit_events_older_than_24_months', (
      SELECT count(*)
      FROM public.security_audit_log
      WHERE created_at < now() - interval '24 months'
    ),
    'role_audit_events_older_than_24_months', (
      SELECT count(*)
      FROM public.auth_role_audit_log
      WHERE created_at < now() - interval '24 months'
    )
  );
$$;

COMMENT ON FUNCTION public.retention_eligibility_report() IS
  'Reports retention-eligible row counts without deleting data.';

REVOKE ALL ON FUNCTION public.retention_eligibility_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retention_eligibility_report()
TO service_role;
