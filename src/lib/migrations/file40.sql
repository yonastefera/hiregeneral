-- Employer-posted job fields used by the dashboard post-job flow.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS salary_frequency TEXT NOT NULL DEFAULT 'Per year',
  ADD COLUMN IF NOT EXISTS boost_id TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS applicant_distance_miles INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS include_relocation BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_email TEXT;

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_status_posted
  ON public.jobs (recruiter_id, status, posted_at DESC);
