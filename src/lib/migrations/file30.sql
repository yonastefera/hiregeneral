-- Add FinQuery as a Lever source.

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
  'FinQuery',
  'finquery.com',
  'lever',
  'finquery',
  'https://jobs.lever.co/finquery',
  true,
  '{"publicBase":"https://jobs.lever.co/finquery"}'::jsonb,
  'Lever source. Existing Lever adapter imports live postings, then normalizes to the shared jobs shape.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
