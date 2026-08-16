-- Read-only verification after dropping legacy profile demographic columns.

SELECT
  legacy.column_name,
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = legacy.column_name
  ) AS present
FROM (VALUES
  ('gender'),
  ('gender_self_describe'),
  ('ethnicity'),
  ('ethnicity_self_describe'),
  ('veteran_status'),
  ('disability_status')
) AS legacy(column_name)
ORDER BY legacy.column_name;

SELECT
  to_regclass('public.profile_demographics') IS NOT NULL
    AS demographics_table_present,
  to_regprocedure('public.prepare_account_deletion(uuid)') IS NOT NULL
    AS deletion_function_present,
  has_function_privilege(
    'anon', 'public.prepare_account_deletion(uuid)', 'EXECUTE'
  ) AS anon_can_prepare_deletion,
  has_function_privilege(
    'authenticated', 'public.prepare_account_deletion(uuid)', 'EXECUTE'
  ) AS authenticated_can_prepare_deletion,
  has_function_privilege(
    'service_role', 'public.prepare_account_deletion(uuid)', 'EXECUTE'
  ) AS service_role_can_prepare_deletion;
