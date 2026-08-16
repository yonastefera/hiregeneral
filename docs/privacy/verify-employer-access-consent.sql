SELECT
  EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'employer_access_consent_at'
  ) AS consent_column_present,
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_public_requires_employer_consent'
  ) AS consent_constraint_present,
  count(*) FILTER (
    WHERE visibility = 'public'
      AND employer_access_consent_at IS NULL
  ) AS public_without_consent
FROM public.profiles;
