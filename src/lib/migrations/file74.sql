-- Add IHG, Ford, Takeda, Honda, and Kalshi technology sources.
-- Ford and Takeda use Radancy/TalentBrew pages. IHG uses the public
-- STG/Havas search host that backs careers.ihg.com. Honda is Phenom, and
-- Kalshi is Greenhouse.

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
    'IHG Hotels & Resorts',
    'ihg.com',
    'scraper',
    'ihg-stg-havas-corporate-us',
    'https://search-ihgcareers.stghavaspeople.com/en/search-and-apply/?area=unitedstates&region=&businessarea=corporate&category=&formtype=qs',
    true,
    '{
      "adapter":"stg-havas",
      "publicBase":"https://search-ihgcareers.stghavaspeople.com",
      "companyWebsite":"https://careers.ihg.com/en/search-and-apply/?area=unitedstates&region=&businessarea=corporate&category=&formtype=qs",
      "category":"Technology",
      "maxPages":4
    }'::jsonb,
    'STG/Havas careers source. Imports IHG United States corporate technology and AI roles from the public search host.'
  ),
  (
    'Ford Motor Company',
    'ford.com',
    'scraper',
    'ford-talentbrew',
    'https://www.careers.ford.com/search-jobs/software/48560/1',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://www.careers.ford.com",
      "companyWebsite":"https://www.careers.ford.com/search-jobs",
      "orgId":"48560",
      "searchTerms":["software","developer","engineer","technology","data","cloud","security"],
      "maxPages":8,
      "category":"Technology"
    }'::jsonb,
    'Radancy/TalentBrew source. Imports Ford US software and technology roles after defensive filters.'
  ),
  (
    'Takeda',
    'takeda.com',
    'scraper',
    'takeda-talentbrew',
    'https://jobs.takeda.com/search-jobs/software/1113/1',
    true,
    '{
      "adapter":"talentbrew",
      "publicBase":"https://jobs.takeda.com",
      "companyWebsite":"https://jobs.takeda.com/search-jobs",
      "orgId":"1113",
      "searchTerms":["software","developer","engineer","technology","data","digital","cloud","security"],
      "maxPages":8,
      "category":"Data, Digital and Technology"
    }'::jsonb,
    'Radancy/TalentBrew source. Imports Takeda US data, digital, and technology roles after defensive filters.'
  ),
  (
    'Honda',
    'honda.com',
    'phenom',
    'honda-phenom',
    'https://careers.honda.com/us/en/search-results?keywords=software',
    true,
    '{
      "widgetApiEndpoint":"https://careers.honda.com/widgets",
      "refNum":"AHMAHMUS",
      "baseUrl":"https://careers.honda.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","cloud","security"],
      "selectedFields":{
        "country":["United States"]
      },
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches Honda United States technology roles before defensive engineering filters.'
  ),
  (
    'Kalshi',
    'kalshi.com',
    'greenhouse',
    'kalshi',
    'https://job-boards.greenhouse.io/kalshi',
    true,
    '{
      "publicBase":"https://job-boards.greenhouse.io/kalshi",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports Kalshi US engineering and technology roles and removes internships.'
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
