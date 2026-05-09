-- Add SuccessFactors source type and American Airlines as the first source.

ALTER TABLE public.job_sources
DROP CONSTRAINT IF EXISTS job_sources_source_type_check;

ALTER TABLE public.job_sources
ADD CONSTRAINT job_sources_source_type_check
CHECK (
  source_type IN (
    'greenhouse',
    'lever',
    'workday',
    'oracle_hcm',
    'successfactors',
    'ashby',
    'rss',
    'csv',
    'scraper'
  )
);

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
  'American Airlines',
  'aa.com',
  'successfactors',
  'american-airlines-successfactors',
  'https://jobs.aa.com/search/?q=software&locationsearch=',
  true,
  '{
    "publicBase":"https://jobs.aa.com",
    "locale":"en_US",
    "searchText":"software",
    "rssUrl":"https://jobs.aa.com/services/rss/job/?locale=en_US&keywords=(software)"
  }'::jsonb,
  'SuccessFactors RSS source. Adapter imports US engineering roles and removes internships.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
