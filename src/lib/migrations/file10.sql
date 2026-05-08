-- Pfizer Workday source.
-- Added as a separate migration so previously applied source batches stay stable.

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
  'Pfizer',
  'pfizer.com',
  'workday',
  'PfizerCareers',
  'https://pfizer.wd1.myworkdayjobs.com/PfizerCareers',
  true,
  '{"tenant":"pfizer","site":"PfizerCareers","publicBase":"https://pfizer.wd1.myworkdayjobs.com/PfizerCareers","searchText":"technology"}'::jsonb,
  'Workday source. Search is narrowed to technology roles before US/engineering filters.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
