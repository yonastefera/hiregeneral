-- Add Phenom source type and Southwest Airlines as the first source.

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
    'phenom',
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
  'Southwest Airlines',
  'southwestair.com',
  'phenom',
  'southwest-airlines-phenom',
  'https://careers.southwestair.com/us/en/search-results?keywords=technology',
  true,
  '{
    "widgetApiEndpoint":"https://careers.southwestair.com/widgets",
    "refNum":"SOUTUS",
    "baseUrl":"https://careers.southwestair.com/us/en",
    "locale":"en_us",
    "country":"us",
    "pageName":"search-results",
    "siteType":"external",
    "searchTerms":["software","developer","technology"],
    "pageSize":25,
    "maxPages":4
  }'::jsonb,
  'Phenom source. Adapter imports US engineering roles and removes internships.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
