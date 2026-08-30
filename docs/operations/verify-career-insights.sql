SELECT
  to_regprocedure('public.current_profile_skill_opportunities()') IS NOT NULL
    AS skill_opportunities_present,
  NOT has_function_privilege(
    'anon', 'public.current_profile_skill_opportunities()', 'EXECUTE'
  ) AS anonymous_opportunities_blocked,
  has_function_privilege(
    'authenticated', 'public.current_profile_skill_opportunities()', 'EXECUTE'
  ) AS authenticated_opportunities_allowed;

-- The SQL editor has no auth.uid(), so an empty array is the correct result.
SELECT public.current_profile_skill_opportunities()
  AS unauthenticated_editor_result;
