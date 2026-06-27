-- Add Bloomberg, S&P Global, Moody's, Datadog, UiPath, Squarespace, and Shutterstock sources.

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
      'Bloomberg',
      'bloomberg.com',
      'scraper',
      'bloomberg-avature-technology-data',
      'https://bloomberg.avature.net/careers/SearchJobs/?1845=%5B162461%2C162535%2C162508%2C162483%2C162484%2C162522%5D&1845_format=3996&2562=%5B219293%2C219290%2C219309%2C219313%5D&2562_format=6594&listFilterMode=1&jobRecordsPerPage=12&',
      true,
      '{
        "adapter":"avature",
        "pageSize":12,
        "pageSizeParam":"jobRecordsPerPage",
        "offsetParam":"jobOffset",
        "category":"Technology",
        "country":"United States",
        "requiredTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "maxPages":8,
        "companyWebsite":"https://bloomberg.avature.net/careers"
      }'::jsonb,
      'Avature source. Imports Bloomberg United States software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'S&P Global',
      'spglobal.com',
      'scraper',
      'sp-global-jibe-technology-data',
      'https://careers.spglobal.com/jobs',
      true,
      '{
        "adapter":"jibe",
        "apiUrl":"https://careers.spglobal.com/api/jobs",
        "publicBase":"https://careers.spglobal.com",
        "category":"Technology",
        "searchQueries":[
          {"keywords":"software","regionCode":"US","internal":"false"},
          {"keywords":"developer","regionCode":"US","internal":"false"},
          {"keywords":"engineer","regionCode":"US","internal":"false"},
          {"keywords":"technology","regionCode":"US","internal":"false"},
          {"keywords":"data","regionCode":"US","internal":"false"},
          {"keywords":"analytics","regionCode":"US","internal":"false"},
          {"keywords":"data science","regionCode":"US","internal":"false"},
          {"keywords":"data engineering","regionCode":"US","internal":"false"},
          {"keywords":"data governance","regionCode":"US","internal":"false"},
          {"keywords":"cloud","regionCode":"US","internal":"false"},
          {"keywords":"security","regionCode":"US","internal":"false"},
          {"keywords":"ai","regionCode":"US","internal":"false"}
        ],
        "maxPages":10,
        "companyWebsite":"https://careers.spglobal.com/jobs"
      }'::jsonb,
      'Jibe source. Searches S&P Global United States software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'Moody''s',
      'moodys.com',
      'scraper',
      'moodys-talentbrew-technology-data',
      'https://careers.moodys.com/en/search-jobs',
      true,
      '{
        "adapter":"talentbrew",
        "publicBase":"https://careers.moodys.com",
        "orgId":"68509",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "category":"Technology",
        "companyWebsite":"https://careers.moodys.com/en/search-jobs",
        "maxPages":6
      }'::jsonb,
      'TalentBrew source. Searches Moody''s software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'Datadog',
      'datadoghq.com',
      'greenhouse',
      'datadog',
      'https://careers.datadoghq.com/all-jobs/?region_Americas%5B0%5D=Americas',
      true,
      '{
        "companyWebsite":"https://careers.datadoghq.com/all-jobs/",
        "publicBase":"https://careers.datadoghq.com"
      }'::jsonb,
      'Greenhouse source. Uses the Datadog board token and imports United States engineering and technology roles.'
    ),
    (
      'UiPath',
      'uipath.com',
      'ashby',
      'uipath-ashby-technology-data',
      'https://jobs.ashbyhq.com/uipath',
      true,
      '{
        "boardName":"uipath",
        "publicBase":"https://jobs.ashbyhq.com/uipath",
        "companyWebsite":"https://www.uipath.com/careers/jobs"
      }'::jsonb,
      'Ashby source. Imports UiPath United States software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'Squarespace',
      'squarespace.com',
      'greenhouse',
      'squarespace',
      'https://www.squarespace.com/about/careers?location=new-york#open-positions',
      true,
      '{
        "companyWebsite":"https://www.squarespace.com/about/careers",
        "publicBase":"https://www.squarespace.com/about/careers"
      }'::jsonb,
      'Greenhouse source. Uses the Squarespace board token and imports United States engineering and technology roles.'
    ),
    (
      'Shutterstock',
      'shutterstock.com',
      'phenom',
      'shutterstock-phenom-technology-data',
      'https://careers.shutterstock.com/us/en/search-results',
      true,
      '{
        "widgetApiEndpoint":"https://careers.shutterstock.com/widgets",
        "refNum":"SHUTUS",
        "baseUrl":"https://careers.shutterstock.com/us/en",
        "locale":"en_us",
        "country":"us",
        "pageName":"search-results",
        "siteType":"external",
        "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "selectedFields":{"country":["United States","United States of America"]},
        "pageSize":50,
        "maxPages":6,
        "preferPublicJobUrl":true
      }'::jsonb,
      'Phenom source. Searches Shutterstock United States software, technology, data, analytics, cloud, security, and AI roles.'
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
