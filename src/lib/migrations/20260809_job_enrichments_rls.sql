-- Job enrichment is public presentation data only when its parent job is
-- currently published. Writes remain restricted to trusted service-role jobs.

ALTER TABLE public.job_enrichments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published job enrichments"
ON public.job_enrichments;

CREATE POLICY "Public can view published job enrichments"
ON public.job_enrichments
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = job_enrichments.job_id
      AND jobs.status = 'published'::public.job_status
      AND (jobs.expires_at IS NULL OR jobs.expires_at > now())
  )
);

REVOKE INSERT, UPDATE, DELETE ON public.job_enrichments
FROM anon, authenticated;
