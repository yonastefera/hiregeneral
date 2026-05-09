-- Add Credit Karma as a Greenhouse source.

INSERT INTO public.job_sources (
  company_name,
  company_domain,
  source_type,
  source_slug,
  source_url,
  enabled,
  metadata,
  notes
)
VALUES (
  'Credit Karma',
  'creditkarma.com',
  'greenhouse',
  'creditkarma',
  'https://job-boards.greenhouse.io/creditkarma',
  false,
  '{"publicBase":"https://job-boards.greenhouse.io/creditkarma"}'::jsonb,
  'Greenhouse board is currently live but has zero openings. Keep disabled until Credit Karma posts active roles again.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
