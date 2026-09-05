-- Keep sitemap generation on a narrow, indexed projection. Returning one JSON
-- value also avoids PostgREST's row cap when the sitemap grows beyond 1,000 jobs.
CREATE INDEX IF NOT EXISTS jobs_sitemap_published_updated_idx
ON public.jobs (updated_at DESC, id)
WHERE status = 'published';

CREATE OR REPLACE FUNCTION public.get_public_job_sitemap(
  p_limit INTEGER DEFAULT 49990
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
SELECT COALESCE(
  jsonb_agg(
    jsonb_build_object(
      'id', job.id,
      'slug', job.slug,
      'updated_at', job.updated_at
    )
    ORDER BY job.updated_at DESC, job.id
  ),
  '[]'::JSONB
)
FROM (
  SELECT id, slug, updated_at
  FROM public.jobs
  WHERE status = 'published'
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY updated_at DESC, id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 49990), 1), 49990)
) job;
$$;

REVOKE ALL ON FUNCTION public.get_public_job_sitemap(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_job_sitemap(INTEGER)
TO anon, authenticated, service_role;
