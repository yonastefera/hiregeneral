-- Add the next requested source batch.
-- Active rows use existing adapters. Unsupported/custom career apps are kept as
-- disabled discovery rows so we do not accidentally run broken imports.

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
    'Invesco',
    'invesco.com',
    'workday',
    'invesco-ivz',
    'https://invesco.wd1.myworkdayjobs.com/IVZ',
    true,
    '{
      "tenant":"invesco",
      "site":"IVZ",
      "apiBase":"https://invesco.wd1.myworkdayjobs.com/wday/cxs/invesco/IVZ",
      "publicBase":"https://invesco.wd1.myworkdayjobs.com/IVZ",
      "searchTexts":["software","engineer","developer","data","security","technology"],
      "appliedFacets":{
        "jobFamilyGroup":["97a56ab3ad0b1018c668298bbb010001"]
      },
      "pageSize":20,
      "maxPages":6
    }'::jsonb,
    'Workday source. Searches Invesco technology roles from the requested job family group before defensive US/engineering filters.'
  ),
  (
    'SiriusXM',
    'siriusxm.com',
    'scraper',
    'siriusxm-jibe',
    'https://careers.siriusxm.com/careers/jobs?keywords=software%20',
    true,
    '{
      "adapter":"jibe",
      "apiUrl":"https://careers.siriusxm.com/api/jobs",
      "publicBase":"https://careers.siriusxm.com/careers",
      "category":"Technology",
      "companyWebsite":"https://www.siriusxm.com",
      "query":{
        "keywords":"software ",
        "location":"United States",
        "regionCode":"US",
        "internal":"false",
        "separator":"|",
        "facetField":"country|city|tags2"
      },
      "maxPages":8
    }'::jsonb,
    'Jibe/iCIMS source. Imports SiriusXM United States software and technology roles from the public careers JSON endpoint.'
  ),
  (
    'Precisely',
    'precisely.com',
    'greenhouse',
    'preciselyusjobs',
    'https://www.precisely.com/careers-and-culture/us-jobs/',
    true,
    '{
      "publicBase":"https://www.precisely.com/careers-and-culture/us-jobs/",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports Precisely US engineering/technology roles and removes internships.'
  ),
  (
    'Agilysys',
    'agilysys.com',
    'scraper',
    'agilysys-jobvite',
    'https://www.agilysys.com/en/careers/#my-section',
    false,
    '{
      "adapterNeeded":"jobvite",
      "searchText":"technology",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery row. Agilysys careers is not a Greenhouse board; it needs a Jobvite adapter before automated imports.'
  ),
  (
    'The New York Times',
    'nytimes.com',
    'greenhouse',
    'thenewyorktimes',
    'https://www.nytco.com/careers/job-listings/',
    true,
    '{
      "publicBase":"https://www.nytco.com/careers/job-listings/",
      "searchText":"technology"
    }'::jsonb,
    'Greenhouse source. Imports NYTCo US engineering/technology roles and removes internships.'
  ),
  (
    'Netflix',
    'netflix.com',
    'scraper',
    'netflix-eightfold',
    'https://explore.jobs.netflix.net/careers?domain=netflix.com&query=software&location=United%20States&sort_by=relevance',
    true,
    '{
      "adapter":"eightfold",
      "apiBase":"https://explore.jobs.netflix.net",
      "domain":"netflix.com",
      "searchText":"software",
      "location":"United States",
      "category":"Technology",
      "sortBy":"relevance",
      "pageSize":10,
      "maxPages":8,
      "companyWebsite":"https://jobs.netflix.com"
    }'::jsonb,
    'Eightfold source. Searches Netflix software roles in the United States before defensive US/engineering filters.'
  ),
  (
    'InComm Payments',
    'incomm.com',
    'scraper',
    'incomm-payments-careers',
    'https://jobs.incommpayments.com/jobs',
    false,
    '{
      "adapterNeeded":"incomm-custom",
      "searchText":"technology",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery row. InComm careers blocks anonymous server-side discovery and needs a dedicated adapter before automated imports.'
  ),
  (
    'Google',
    'google.com',
    'scraper',
    'google-careers-custom',
    'https://www.google.com/about/careers/applications/jobs/results',
    false,
    '{
      "adapterNeeded":"google-careers-custom",
      "searchText":"software",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery row. Google careers requires a dedicated first-party search adapter before automated imports.'
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
    'Disabled discovery row. DoorDash careers needs a dedicated adapter before automated imports.'
  ),
  (
    'Paylocity',
    'paylocity.com',
    'scraper',
    'paylocity-careers-custom',
    'https://www.paylocity.com/company/careers/all-listings/?t=data+&r=10&p=2',
    false,
    '{
      "adapterNeeded":"paylocity-custom",
      "searchText":"data",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery row. Paylocity careers needs a dedicated listing adapter before automated imports.'
  ),
  (
    'Microsoft',
    'microsoft.com',
    'scraper',
    'microsoft-insidetrack-custom',
    'https://www.microsoft.com/en-us/insidetrack/careers',
    false,
    '{
      "adapterNeeded":"microsoft-careers-custom",
      "searchText":"software",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery row. The requested Inside Track page is not a direct jobs feed and needs a dedicated Microsoft careers adapter before imports.'
  ),
  (
    'Apple',
    'apple.com',
    'scraper',
    'apple-careers-custom',
    'https://jobs.apple.com/en-us/search?location=austin-metro-area-AUSMETRO+austin-AST',
    false,
    '{
      "adapterNeeded":"apple-careers-custom",
      "searchText":"software",
      "location":"Austin, TX",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery row. Apple Jobs needs a dedicated search adapter before automated imports.'
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

UPDATE public.job_sources
SET
  enabled = false,
  metadata = jsonb_build_object(
    'adapterNeeded',
    'jobvite',
    'supersededBy',
    'agilysys-jobvite'
  ),
  notes = 'Disabled. This Greenhouse slug returned zero because Agilysys is not hosted on that board; use the Jobvite discovery row until a Jobvite adapter is implemented.',
  updated_at = now()
WHERE source_type = 'greenhouse'
  AND source_slug = 'agilysys';
