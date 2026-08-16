-- Read-only verification for profile demographic-data separation.

SELECT
  to_regclass('public.profile_demographics') IS NOT NULL AS table_present,
  COALESCE((
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = to_regclass('public.profile_demographics')
  ), false) AS rls_enabled,
  has_table_privilege('anon', 'public.profile_demographics', 'SELECT')
    AS anon_can_select,
  has_table_privilege('authenticated', 'public.profile_demographics', 'SELECT')
    AS authenticated_has_table_select;

SELECT
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profile_demographics'
ORDER BY policyname;

SELECT
  count(*) AS legacy_profiles_with_demographics
FROM public.profiles
WHERE gender IS NOT NULL
   OR gender_self_describe IS NOT NULL
   OR ethnicity IS NOT NULL
   OR ethnicity_self_describe IS NOT NULL
   OR veteran_status IS NOT NULL
   OR disability_status IS NOT NULL;

SELECT
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_demographics_separated'
      AND convalidated
  ) AS null_constraint_present,
  EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.profiles'::regclass
      AND tgname = 'delete_demographics_for_deleted_profile'
      AND NOT tgisinternal
  ) AS deletion_trigger_present;
