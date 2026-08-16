-- Verify the report-only retention migration and inspect current eligibility.

SELECT
  to_regprocedure('public.retention_eligibility_report()') IS NOT NULL
    AS function_present,
  has_function_privilege(
    'anon',
    'public.retention_eligibility_report()',
    'EXECUTE'
  ) AS anon_can_execute,
  has_function_privilege(
    'authenticated',
    'public.retention_eligibility_report()',
    'EXECUTE'
  ) AS authenticated_can_execute,
  has_function_privilege(
    'service_role',
    'public.retention_eligibility_report()',
    'EXECUTE'
  ) AS service_role_can_execute;

-- The SQL Editor can invoke the report as its privileged database role.
SELECT public.retention_eligibility_report() AS retention_report;
