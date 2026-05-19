-- Employer dashboard query performance.
-- Supports recruiter-scoped job management, status tabs, and lightweight search.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_created_at
  ON public.jobs (recruiter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_status_created_at
  ON public.jobs (recruiter_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm
  ON public.jobs USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_jobs_company_name_trgm
  ON public.jobs USING GIN (company_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_jobs_location_trgm
  ON public.jobs USING GIN (location gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_applications_job_created_at
  ON public.applications (job_id, created_at DESC);
