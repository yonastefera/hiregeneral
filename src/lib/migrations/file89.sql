-- Add LPL Financial, General Atlantic, and Travelers sources; refresh New York Life.
-- Travelers uses the Google M-Cloud UUID API shape and is parked until that adapter is added.

WITH sources (
  company_name,
  company_domain,
  source_type,
  source_slug,
  source_url,
  enabled,
  metadata,
  notes
) AS (
  VALUES
    (
      'LPL Financial',
      'lpl.com',
      'phenom',
      'lpl-financial-phenom-technology',
      'https://career.lpl.com/search-results',
      true,
      '{
        "widgetApiEndpoint":"https://career.lpl.com/widgets",
        "refNum":"LFMLFFUS",
        "baseUrl":"https://career.lpl.com",
        "locale":"en_us",
        "country":"us",
        "pageName":"search-results",
        "siteType":"external",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "selectedFields":{
          "country":["United States","United States of America"]
        },
        "pageSize":50,
        "maxPages":6,
        "preferPublicJobUrl":true
      }'::jsonb,
      'Phenom source. Searches LPL Financial United States software, data, analytics, technology, cloud, security, and AI roles before defensive filters.'
    ),
    (
      'General Atlantic',
      'generalatlantic.com',
      'greenhouse',
      'generalatlantic',
      'https://www.generalatlantic.com/open-roles/',
      true,
      '{
        "companyWebsite":"https://www.generalatlantic.com/open-roles/",
        "publicBase":"https://www.generalatlantic.com/open-roles/"
      }'::jsonb,
      'Greenhouse source. Imports General Atlantic United States engineering and technology-adjacent roles from the public board.'
    ),
    (
      'New York Life',
      'newyorklife.com',
      'scraper',
      'new-york-life-eightfold-technology',
      'https://careers.newyorklife.com/careers?Category=technology&Category=data%20%2F%20ai&domain=newyorklife.com&sort_by=relevance',
      true,
      '{
        "adapter":"eightfold",
        "apiBase":"https://careers.newyorklife.com",
        "domain":"newyorklife.com",
        "searchText":"technology",
        "searchTexts":["technology","software","developer","engineer","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "location":"United States",
        "sortBy":"relevance",
        "pageSize":10,
        "maxPages":8,
        "companyWebsite":"https://careers.newyorklife.com/careers"
      }'::jsonb,
      'Eightfold source. Refreshes the existing New York Life source to keep technology, data, AI, cloud, and security searches broad instead of pid-specific.'
    ),
    (
      'Travelers',
      'travelers.com',
      'scraper',
      'travelers-mcloud-google-technology',
      'https://careers.travelers.com/job-search-results/',
      false,
      '{
        "adapterNeeded":"mcloud-google",
        "apiBase":"https://jobsapi-google.m-cloud.io/api",
        "orgId":"companies/bf9637bf-a80e-40cb-a7a8-326912e9684f",
        "publicBase":"https://careers.travelers.com",
        "jobdetailPath":"/job",
        "category":"Technology",
        "facets":["addtnl_categories:Technology~Data Analytics~Data Science"],
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "companyWebsite":"https://careers.travelers.com/job-search-results/",
        "pageSize":50,
        "maxPages":4
      }'::jsonb,
      'Parked source. Travelers uses the Google M-Cloud UUID org API shape exposed by CWS/XCloud; enable after adding an mcloud-google adapter.'
    )
),
updated AS (
  UPDATE public.job_sources AS job_sources
  SET
    company_name = sources.company_name,
    company_domain = sources.company_domain,
    source_type = sources.source_type,
    source_url = sources.source_url,
    enabled = sources.enabled,
    metadata = sources.metadata,
    notes = sources.notes
  FROM sources
  WHERE job_sources.source_slug = sources.source_slug
  RETURNING job_sources.source_slug
)
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
SELECT
  sources.company_name,
  sources.company_domain,
  sources.source_type,
  sources.source_slug,
  sources.source_url,
  sources.enabled,
  sources.metadata,
  sources.notes
FROM sources
WHERE NOT EXISTS (
  SELECT 1
  FROM updated
  WHERE updated.source_slug = sources.source_slug
);
