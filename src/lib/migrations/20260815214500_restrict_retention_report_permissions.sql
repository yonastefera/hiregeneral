-- Correct direct Data API grants that are not removed by revoking PUBLIC.

REVOKE ALL ON FUNCTION public.retention_eligibility_report()
FROM anon;

REVOKE ALL ON FUNCTION public.retention_eligibility_report()
FROM authenticated;

GRANT EXECUTE ON FUNCTION public.retention_eligibility_report()
TO service_role;
