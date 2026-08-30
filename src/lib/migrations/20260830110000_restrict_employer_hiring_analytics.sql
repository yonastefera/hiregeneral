-- Keep employer analytics callable only by authenticated application users.
REVOKE EXECUTE ON FUNCTION public.employer_hiring_analytics(INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.employer_hiring_analytics(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.employer_hiring_analytics(INTEGER) TO authenticated;
