-- Performance indexes for public job browsing/search.
-- These match /api/jobs filters: published status, expiry, posted date,
-- company filtering, category filtering, and location filtering.

CREATE INDEX IF NOT EXISTS idx_jobs_published_posted_at
ON public.jobs (posted_at DESC)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_jobs_published_expires_at
ON public.jobs (expires_at)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_jobs_published_company_name
ON public.jobs (company_name)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_jobs_published_category
ON public.jobs (category)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_jobs_published_work_mode
ON public.jobs (work_mode)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_jobs_published_employment_type
ON public.jobs (employment_type)
WHERE status = 'published';
