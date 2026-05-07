-- Workday and future adapters need source-specific connection metadata.
ALTER TABLE public.job_sources
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

INSERT INTO public.job_sources (
  company_name,
  company_domain,
  source_type,
  source_slug,
  source_url,
  enabled,
  metadata
)
VALUES (
  'Capital One',
  'capitalone.com',
  'workday',
  'Capital_One',
  'https://capitalone.wd12.myworkdayjobs.com/en-US/Capital_One',
  true,
  '{"tenant":"capitalone","site":"Capital_One","publicBase":"https://capitalone.wd12.myworkdayjobs.com/en-US/Capital_One"}'::jsonb
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata;
