-- Job ingestion fields used by API-backed listings and ATS imports.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS source_id TEXT,
  ADD COLUMN IF NOT EXISTS apply_url TEXT,
  ADD COLUMN IF NOT EXISTS responsibilities TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requirements TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS benefits TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_level TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS company_tagline TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT,
  ADD COLUMN IF NOT EXISTS company_website TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_slug_unique
  ON public.jobs (slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_source_unique
  ON public.jobs (source_name, source_id);

CREATE INDEX IF NOT EXISTS idx_jobs_category
  ON public.jobs (category);

CREATE INDEX IF NOT EXISTS idx_jobs_expires_at
  ON public.jobs (expires_at);
