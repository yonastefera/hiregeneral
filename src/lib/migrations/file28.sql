-- Add the next batch of supported sources.
-- These are all backed by adapters we already run in production ingestion:
-- Lever and Workday.

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
VALUES
  (
    'Revinate',
    'revinate.com',
    'lever',
    'revinate',
    'https://jobs.lever.co/revinate',
    true,
    '{"publicBase":"https://jobs.lever.co/revinate"}'::jsonb,
    'Lever source. Existing Lever adapter imports live postings, then normalizes to the shared jobs shape.'
  ),
  (
    'Gates Foundation',
    'gatesfoundation.org',
    'workday',
    'Gates',
    'https://gatesfoundation.wd1.myworkdayjobs.com/Gates?source=gatesfoundation.org',
    true,
    '{
      "tenant":"gatesfoundation",
      "site":"Gates",
      "publicBase":"https://gatesfoundation.wd1.myworkdayjobs.com/Gates",
      "searchText":"technology"
    }'::jsonb,
    'Workday source. Search is narrowed to technology roles before US/engineering filters.'
  ),
  (
    'Primerica',
    'primerica.com',
    'workday',
    'PRI',
    'https://primerica.wd1.myworkdayjobs.com/PRI',
    true,
    '{
      "tenant":"primerica",
      "site":"PRI",
      "publicBase":"https://primerica.wd1.myworkdayjobs.com/PRI",
      "searchText":"technology"
    }'::jsonb,
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
