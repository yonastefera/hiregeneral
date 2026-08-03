-- Run in the Supabase SQL editor after deploying all 2026-08-02 migrations.
-- A successful audit returns rows with `present = true` only.

WITH required_functions(name) AS (
  VALUES
    ('claim_billing_event'),
    ('finish_billing_event'),
    ('apply_company_billing_event'),
    ('current_employer_entitlements'),
    ('enforce_job_entitlements'),
    ('enforce_invitation_entitlements'),
    ('enforce_employer_message_entitlements'),
    ('append_security_audit'),
    ('audit_job_lifecycle'),
    ('audit_employer_invitation'),
    ('audit_company_billing_change'),
    ('audit_billing_record'),
    ('audit_account_deletion')
)
SELECT
  'function' AS object_type,
  required_functions.name AS object_name,
  EXISTS (
    SELECT 1
    FROM pg_proc
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE pg_namespace.nspname = 'public'
      AND pg_proc.proname = required_functions.name
  ) AS present
FROM required_functions

UNION ALL

SELECT
  'trigger',
  required_triggers.name,
  EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name = required_triggers.name
  )
FROM (
  VALUES
    ('audit_job_lifecycle'),
    ('audit_employer_invitation'),
    ('audit_company_billing_change'),
    ('audit_billing_receipt'),
    ('audit_job_boost'),
    ('audit_account_deletion'),
    ('enforce_job_entitlements'),
    ('enforce_invitation_entitlements'),
    ('enforce_employer_message_entitlements')
) AS required_triggers(name)

UNION ALL

SELECT
  'storage_policy',
  required_policies.name,
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = required_policies.name
  )
FROM (
  VALUES
    ('Users can upload their own avatars'),
    ('Users can read their own avatars'),
    ('Users can update their own avatars'),
    ('Users can delete their own avatars')
) AS required_policies(name)

ORDER BY object_type, object_name;
