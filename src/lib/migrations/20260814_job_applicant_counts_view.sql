-- Supply the applicant-count relationship consumed by public job details and
-- recruiter job management. security_invoker keeps the underlying application
-- RLS policies in force for every caller.
CREATE OR REPLACE VIEW public.job_applicant_counts
WITH (security_invoker = true)
AS
SELECT
  applications.job_id,
  count(*)::bigint AS applicant_count
FROM public.applications
GROUP BY applications.job_id;

GRANT SELECT ON public.job_applicant_counts TO anon, authenticated;
