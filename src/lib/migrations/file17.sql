-- Add the first Oracle Cloud HCM source adapter and enable Travelport.
-- Oracle CE uses the recruitingCEJobRequisitions finder endpoint.

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
    'ashby',
    'rss',
    'csv',
    'scraper'
  )
);

UPDATE public.job_sources
SET enabled = false
WHERE company_name = 'Travelport'
  AND source_type = 'scraper';

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
  'Travelport',
  'travelport.com',
  'oracle_hcm',
  'travelport-cx-1',
  'https://ejzg.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1',
  true,
  '{
    "apiBase":"https://ejzg.fa.us6.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
    "publicBase":"https://ejzg.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1",
    "siteNumber":"CX_1",
    "searchText":"technology",
    "countryCode":"US",
    "selectedLocationsFacet":"300000000298151"
  }'::jsonb,
  'Oracle Cloud HCM source. Search is narrowed to technology roles; adapter defensively filters US and engineering roles.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
