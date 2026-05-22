-- Add Freddie Mac, The Cigna Group, and MetLife technology job sources.
-- Centene was checked during discovery and is intentionally not added yet
-- because its careers site returned a 403 challenge to the ingestion client.

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
    'Freddie Mac',
    'freddiemac.com',
    'phenom',
    'freddie-mac-phenom',
    'https://careers.freddiemac.com/us/en/c/technology-jobs',
    true,
    '{
      "widgetApiEndpoint":"https://careers.freddiemac.com/widgets",
      "refNum":"FRMAUS",
      "baseUrl":"https://careers.freddiemac.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics"],
      "selectedFields":{"category":["Technology"]},
      "pageSize":50,
      "maxPages":5
    }'::jsonb,
    'Phenom source. Searches Freddie Mac technology roles before defensive US/engineering filters.'
  ),
  (
    'The Cigna Group',
    'thecignagroup.com',
    'phenom',
    'cigna-group-phenom',
    'https://jobs.thecignagroup.com/us/en/c/technology-jobs',
    true,
    '{
      "widgetApiEndpoint":"https://jobs.thecignagroup.com/widgets",
      "refNum":"CIGNUS",
      "baseUrl":"https://jobs.thecignagroup.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics"],
      "selectedFields":{"category":["Technology"]},
      "pageSize":50,
      "maxPages":5
    }'::jsonb,
    'Phenom source. Searches The Cigna Group technology roles before defensive US/engineering filters.'
  ),
  (
    'MetLife',
    'metlife.com',
    'scraper',
    'metlife-avature-technology',
    'https://www.metlifecareers.com/en_US/ml/SearchJobs?3_87_3=81476',
    true,
    '{
      "adapter":"avature",
      "category":"Technology",
      "pageSize":6,
      "maxPages":8,
      "pageSizeParam":"jobRecordsPerPage",
      "offsetParam":"jobOffset",
      "companyWebsite":"https://www.metlifecareers.com/en_US/ml/Technology"
    }'::jsonb,
    'Avature source. Searches MetLife technology roles before defensive US/engineering filters.'
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
