-- Read-only verification for the two-phase account-deletion functions.

SELECT
  function_name,
  to_regprocedure('public.' || function_name || '(uuid)') IS NOT NULL AS present,
  has_function_privilege(
    'anon', 'public.' || function_name || '(uuid)', 'EXECUTE'
  ) AS anon_can_execute,
  has_function_privilege(
    'authenticated', 'public.' || function_name || '(uuid)', 'EXECUTE'
  ) AS authenticated_can_execute,
  has_function_privilege(
    'service_role', 'public.' || function_name || '(uuid)', 'EXECUTE'
  ) AS service_role_can_execute
FROM (VALUES
  ('prepare_account_deletion'),
  ('complete_account_deletion')
) AS functions(function_name)
ORDER BY function_name;

SELECT
  to_regclass('public.profiles_deletion_execution_idx') IS NOT NULL
    AS execution_index_present,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'deletion_completed_at'
  ) AS completion_column_present;
