-- Add GE Aerospace, GE HealthCare, and GE Vernova technology sources.
-- GE Aerospace and GE HealthCare use Phenom; GE Vernova is backed by Workday.

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
    'GE Aerospace',
    'geaerospace.com',
    'phenom',
    'ge-aerospace-phenom',
    'https://careers.geaerospace.com/global/en/search-results',
    true,
    '{
      "widgetApiEndpoint":"https://careers.geaerospace.com/widgets",
      "refNum":"GAOGAYGLOBAL",
      "baseUrl":"https://careers.geaerospace.com/global/en",
      "locale":"en_global",
      "country":"global",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics","cyber"],
      "selectedFields":{},
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches GE Aerospace United States technology roles before defensive engineering filters.'
  ),
  (
    'GE HealthCare',
    'gehealthcare.com',
    'phenom',
    'ge-healthcare-phenom',
    'https://careers.gehealthcare.com/global/en/search-results',
    true,
    '{
      "widgetApiEndpoint":"https://careers.gehealthcare.com/widgets",
      "refNum":"GEVGHLGLOBAL",
      "baseUrl":"https://careers.gehealthcare.com/global/en",
      "locale":"en_global",
      "country":"global",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics","cyber"],
      "selectedFields":{},
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches GE HealthCare United States technology roles before defensive engineering filters.'
  ),
  (
    'GE Vernova',
    'gevernova.com',
    'workday',
    'ge-vernova-external',
    'https://gevernova.wd5.myworkdayjobs.com/Vernova_ExternalSite',
    true,
    '{
      "tenant":"gevernova",
      "site":"Vernova_ExternalSite",
      "apiBase":"https://gevernova.wd5.myworkdayjobs.com/wday/cxs/gevernova/Vernova_ExternalSite",
      "publicBase":"https://gevernova.wd5.myworkdayjobs.com/Vernova_ExternalSite",
      "searchTexts":["software","developer","engineer","technology","data","analytics","cyber"],
      "appliedFacets":{
        "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"]
      },
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Searches GE Vernova United States technology roles before defensive engineering filters.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  updated_at = now();
