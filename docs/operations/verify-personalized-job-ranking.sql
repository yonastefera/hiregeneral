SELECT
  to_regprocedure('public.rank_jobs_for_current_profile(uuid[])') IS NOT NULL
    AS ranking_function_present,
  NOT has_function_privilege(
    'anon', 'public.rank_jobs_for_current_profile(uuid[])', 'EXECUTE'
  ) AS anonymous_ranking_blocked,
  has_function_privilege(
    'authenticated', 'public.rank_jobs_for_current_profile(uuid[])', 'EXECUTE'
  ) AS authenticated_ranking_allowed;

-- Run the application-level check while signed in as a seeker. The SQL editor
-- has no auth.uid(), so a direct call here correctly returns an empty array.
SELECT public.rank_jobs_for_current_profile(
  ARRAY(SELECT id FROM public.jobs WHERE status = 'published' LIMIT 5)
) AS unauthenticated_editor_result;
