SELECT
  to_regprocedure(
    'public.get_hiring_companies_this_week(integer)'
  ) IS NOT NULL AS function_present,
  has_function_privilege(
    'anon',
    'public.get_hiring_companies_this_week(integer)',
    'EXECUTE'
  ) AS anon_can_execute,
  has_function_privilege(
    'authenticated',
    'public.get_hiring_companies_this_week(integer)',
    'EXECUTE'
  ) AS authenticated_can_execute,
  has_function_privilege(
    'service_role',
    'public.get_hiring_companies_this_week(integer)',
    'EXECUTE'
  ) AS service_role_can_execute;
