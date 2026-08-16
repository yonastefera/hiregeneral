-- Run after 20260816070000_restrict_recruiter_profile_access.sql.
-- Expected: owner_admin_policy_count=1 and recruiter_policy_count=0.
SELECT
  count(*) FILTER (
    WHERE policyname = 'Owners and admins can view profiles'
      AND cmd = 'SELECT'
  ) AS owner_admin_policy_count,
  count(*) FILTER (
    WHERE cmd = 'SELECT'
      AND COALESCE(qual, '') ILIKE '%recruiter%'
  ) AS recruiter_policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';
