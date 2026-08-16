-- Read-only verification for 20260815211000_account_deletion_grace_period.sql.

SELECT
  'function' AS object_type,
  'enforce_account_deletion_grace_period' AS object_name,
  to_regprocedure(
    'public.enforce_account_deletion_grace_period()'
  ) IS NOT NULL AS present
UNION ALL
SELECT
  'function',
  'audit_account_deletion',
  to_regprocedure('public.audit_account_deletion()') IS NOT NULL
UNION ALL
SELECT
  'index',
  'profiles_pending_deletion_idx',
  to_regclass('public.profiles_pending_deletion_idx') IS NOT NULL
UNION ALL
SELECT
  'trigger',
  'enforce_account_deletion_grace_period',
  EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'enforce_account_deletion_grace_period'
      AND tgrelid = 'public.profiles'::regclass
      AND NOT tgisinternal
  )
ORDER BY object_type, object_name;
