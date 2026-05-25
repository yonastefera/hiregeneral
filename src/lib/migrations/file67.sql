-- Add the next requested technology sources.
-- Active rows use existing trusted adapters: Greenhouse, Workday, and Avature.
-- Computacenter and DoorDash are recorded as disabled discovery rows because
-- their current public career apps need dedicated custom adapters.

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
    'Dropbox',
    'dropbox.com',
    'greenhouse',
    'dropbox',
    'https://www.dropbox.jobs/en/jobs/?search=&location=Remote+-+US%3A+Select+locations&location=Remote+-+US%3A+All+locations&pagesize=20#results',
    true,
    '{
      "publicBase":"https://www.dropbox.jobs/en/jobs/",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports Dropbox US/remote technology roles and removes internships.'
  ),
  (
    'Zendesk',
    'zendesk.com',
    'workday',
    'zendesk',
    'https://zendesk.wd1.myworkdayjobs.com/en-US/zendesk',
    true,
    '{
      "tenant":"zendesk",
      "site":"zendesk",
      "apiBase":"https://zendesk.wd1.myworkdayjobs.com/wday/cxs/zendesk/zendesk",
      "publicBase":"https://zendesk.wd1.myworkdayjobs.com/en-US/zendesk",
      "searchTexts":["software","engineer","developer","data","security","technology"],
      "appliedFacets":{
        "locationCountry":["bc33aa3152ec42d4995f4791a106ed09"]
      },
      "pageSize":20,
      "maxPages":5
    }'::jsonb,
    'Workday source. Searches Zendesk United States technology roles before defensive filters.'
  ),
  (
    'Okta',
    'okta.com',
    'greenhouse',
    'okta',
    'https://www.okta.com/company/careers/',
    true,
    '{
      "publicBase":"https://www.okta.com/company/careers/",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports Okta US engineering/technology roles and removes internships.'
  ),
  (
    'Computacenter',
    'computacenter.com',
    'scraper',
    'computacenter-job-shop',
    'https://careers.computacenter.com/north-america/search?utm_source=site_corporate&utm_medium=careers_hp_bottom&utm_campaign=perma_link&utm_content=link',
    false,
    '{
      "adapterNeeded":"job-shop-typesense",
      "searchText":"technology",
      "region":"North America"
    }'::jsonb,
    'Disabled discovery row. Computacenter uses a Job Shop/Typesense career app that needs a dedicated adapter before automated imports.'
  ),
  (
    'Ping Identity',
    'pingidentity.com',
    'greenhouse',
    'pingidentity',
    'https://www.pingidentity.com/en/company/careers/careers-listings.html',
    true,
    '{
      "publicBase":"https://job-boards.greenhouse.io/pingidentity",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports Ping Identity US engineering/technology roles and removes internships.'
  ),
  (
    'PagerDuty',
    'pagerduty.com',
    'greenhouse',
    'pagerduty',
    'https://careers.pagerduty.com/jobs/search',
    true,
    '{
      "publicBase":"https://job-boards.greenhouse.io/pagerduty",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports PagerDuty US engineering/technology roles and removes internships.'
  ),
  (
    'Siemens',
    'siemens.com',
    'scraper',
    'siemens-avature-technology',
    'https://jobs.siemens.com/en_US/externaljobs/SearchJobs/?42386=%5B812209%5D&42386_format=17546&listFilterMode=1&folderRecordsPerPage=6&',
    true,
    '{
      "adapter":"avature",
      "category":"Technology",
      "country":"United States",
      "pageSize":6,
      "maxPages":8,
      "pageSizeParam":"folderRecordsPerPage",
      "offsetParam":"folderOffset",
      "companyWebsite":"https://jobs.siemens.com/en_US/externaljobs/SearchJobs/"
    }'::jsonb,
    'Avature source. Uses Siemens technology search results before defensive US/engineering filters.'
  ),
  (
    'Pinterest',
    'pinterest.com',
    'greenhouse',
    'pinterest',
    'https://www.pinterestcareers.com/jobs/?search=&pagesize=20#results',
    true,
    '{
      "publicBase":"https://www.pinterestcareers.com/jobs/",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports Pinterest US engineering/technology roles and removes internships.'
  ),
  (
    'Johnson & Johnson',
    'jnj.com',
    'workday',
    'johnson-and-johnson-jj',
    'https://jj.wd5.myworkdayjobs.com/en-US/JJ',
    true,
    '{
      "tenant":"jj",
      "site":"JJ",
      "apiBase":"https://jj.wd5.myworkdayjobs.com/wday/cxs/jj/JJ",
      "publicBase":"https://jj.wd5.myworkdayjobs.com/en-US/JJ",
      "searchTexts":["software","engineer","developer","data","security","technology"],
      "appliedFacets":{
        "jobFamilyGroup":[
          "604dc786859810010c31edc949e30000",
          "604dc786859810010c32cb26337f0000",
          "604dc786859810010c32d302146a0000"
        ]
      },
      "pageSize":20,
      "maxPages":5
    }'::jsonb,
    'Workday source. Searches J&J data, technology security, and technology product/platform roles before defensive US filters.'
  ),
  (
    'DoorDash',
    'doordash.com',
    'scraper',
    'doordash-careers-custom',
    'https://careersatdoordash.com/job-search/',
    false,
    '{
      "adapterNeeded":"doordash-custom",
      "searchText":"software",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery row. DoorDash careers blocks direct server-side discovery and needs a dedicated adapter before automated imports.'
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
