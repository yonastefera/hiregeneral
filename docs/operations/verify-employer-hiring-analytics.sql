SELECT
  to_regprocedure('public.employer_hiring_analytics(integer)') IS NOT NULL
    AS employer_hiring_analytics_present,
  has_function_privilege(
    'authenticated',
    'public.employer_hiring_analytics(integer)',
    'EXECUTE'
  ) AS authenticated_can_execute,
  NOT has_function_privilege(
    'anon',
    'public.employer_hiring_analytics(integer)',
    'EXECUTE'
  ) AS anonymous_cannot_execute,
  to_regclass('public.employer_team_members') IS NOT NULL
    AS employer_team_present,
  to_regclass('public.application_status_events') IS NOT NULL
    AS application_status_events_present;
