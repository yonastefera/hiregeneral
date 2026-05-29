-- Add the next requested financial services, healthcare, and technology sources.
-- Active rows use existing Workday, Phenom, and Attrax adapters. Fidelity,
-- Vanguard, and IBM are kept as disabled discovery rows until their current
-- custom/blocked search surfaces can be imported safely.

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
    'Vanguard',
    'vanguard.com',
    'scraper',
    'vanguard-mcloud-google-technology',
    'https://www.vanguardjobs.com/job-search-results/?category[]=Technology',
    false,
    '{
      "adapterNeeded":"mcloud-google",
      "apiBase":"https://jobsapi-google.m-cloud.io/api",
      "organization":"companies/fbd5ce04-22d1-4aae-90dc-0282e45ee06f",
      "filters":["is_internal:External"],
      "category":"Technology",
      "companyWebsite":"https://www.vanguardjobs.com/job-search-results/"
    }'::jsonb,
    'Disabled discovery row. Vanguard uses a Google-backed M-Cloud endpoint with a companies/... organization id; the existing M-Cloud adapter only supports the numeric internal endpoint.'
  ),
  (
    'Fidelity TalentSource',
    'fidelitytalentsource.com',
    'scraper',
    'fidelity-talentsource-cloudflare',
    'https://www.fidelitytalentsource.com/job-search/?search=&location=&origin=global',
    false,
    '{
      "adapterNeeded":"fidelity-talentsource",
      "blockedBy":"cloudflare",
      "companyWebsite":"https://www.fidelitytalentsource.com/job-search/"
    }'::jsonb,
    'Disabled discovery row. Fidelity TalentSource currently returns a Cloudflare block to anonymous server-side ingestion requests.'
  ),
  (
    'Capital Group',
    'capitalgroup.com',
    'workday',
    'capital-group-workday-technology',
    'https://capgroup.wd1.myworkdayjobs.com/capitalgroupcareers',
    true,
    '{
      "tenant":"capgroup",
      "site":"capitalgroupcareers",
      "apiBase":"https://capgroup.wd1.myworkdayjobs.com/wday/cxs/capgroup/capitalgroupcareers",
      "publicBase":"https://capgroup.wd1.myworkdayjobs.com/capitalgroupcareers",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Searches Capital Group technology roles and keeps US roles through defensive filters.'
  ),
  (
    'PIMCO',
    'pimco.com',
    'workday',
    'pimco-workday-technology',
    'https://pimco.wd1.myworkdayjobs.com/pimco-careers',
    true,
    '{
      "tenant":"pimco",
      "site":"pimco-careers",
      "apiBase":"https://pimco.wd1.myworkdayjobs.com/wday/cxs/pimco/pimco-careers",
      "publicBase":"https://pimco.wd1.myworkdayjobs.com/pimco-careers",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Searches PIMCO technology roles and keeps US roles through defensive filters.'
  ),
  (
    'Franklin Templeton',
    'franklintempleton.com',
    'workday',
    'franklin-templeton-workday-technology',
    'https://franklintempleton.wd5.myworkdayjobs.com/Primary-External-1',
    true,
    '{
      "tenant":"franklintempleton",
      "site":"Primary-External-1",
      "apiBase":"https://franklintempleton.wd5.myworkdayjobs.com/wday/cxs/franklintempleton/Primary-External-1",
      "publicBase":"https://franklintempleton.wd5.myworkdayjobs.com/Primary-External-1",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Searches Franklin Templeton technology roles and keeps US roles through defensive filters.'
  ),
  (
    'Wellington Management',
    'wellington.com',
    'workday',
    'wellington-workday-technology',
    'https://wellington.wd5.myworkdayjobs.com/External?locations=26304b0c664210569c10f1c972eeb793&locations=26304b0c664210569c10fb1c8899b7ae&locations=7a16f0a283870154e35984593945f6f6&locations=8f5223e050820100c051f8972d960000&locations=26304b0c664210569c110178aa15b7c0&locations=26304b0c664210569c10ee1b0c8cb78a&jobFamilyGroup=5443731c44d3101790b8e1764986760a&jobFamilyGroup=53c84c2b57e31008d7c2504002b6a745',
    true,
    '{
      "tenant":"wellington",
      "site":"External",
      "apiBase":"https://wellington.wd5.myworkdayjobs.com/wday/cxs/wellington/External",
      "publicBase":"https://wellington.wd5.myworkdayjobs.com/External",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "appliedFacets":{
        "locations":["26304b0c664210569c10f1c972eeb793","26304b0c664210569c10fb1c8899b7ae","7a16f0a283870154e35984593945f6f6","8f5223e050820100c051f8972d960000","26304b0c664210569c110178aa15b7c0","26304b0c664210569c10ee1b0c8cb78a"],
        "jobFamilyGroup":["5443731c44d3101790b8e1764986760a","53c84c2b57e31008d7c2504002b6a745"]
      },
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Uses the requested Wellington technology family and location facets, then keeps US roles through defensive filters.'
  ),
  (
    'T. Rowe Price',
    'troweprice.com',
    'workday',
    't-rowe-price-workday-technology',
    'https://troweprice.wd5.myworkdayjobs.com/TRowePrice/jobs?jobFamilyGroup=d3372256bd6c016f4b5e1ba3b1009735&jobFamilyGroup=5136e4a0469101596cfe3a9ab100d237&jobFamilyGroup=5136e4a0469101ad90f24399b100bc37&jobFamilyGroup=d3372256bd6c01a0a63affa2b1009335',
    true,
    '{
      "tenant":"troweprice",
      "site":"TRowePrice",
      "apiBase":"https://troweprice.wd5.myworkdayjobs.com/wday/cxs/troweprice/TRowePrice",
      "publicBase":"https://troweprice.wd5.myworkdayjobs.com/TRowePrice",
      "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security"],
      "appliedFacets":{
        "jobFamilyGroup":["d3372256bd6c016f4b5e1ba3b1009735","5136e4a0469101596cfe3a9ab100d237","5136e4a0469101ad90f24399b100bc37","d3372256bd6c01a0a63affa2b1009335"]
      },
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Uses the requested T. Rowe Price technology family facets, then keeps US roles through defensive filters.'
  ),
  (
    'HPE',
    'hpe.com',
    'phenom',
    'hpe-phenom',
    'https://careers.hpe.com/us/en/search-results',
    true,
    '{
      "widgetApiEndpoint":"https://careers.hpe.com/widgets",
      "refNum":"HPE1US",
      "baseUrl":"https://careers.hpe.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","cyber"],
      "selectedFields":{
        "country":["United States of America"]
      },
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches HPE United States technology roles before defensive engineering filters.'
  ),
  (
    'Eli Lilly and Company',
    'lilly.com',
    'phenom',
    'lilly-phenom',
    'https://careers.lilly.com/us/en/search-results',
    true,
    '{
      "widgetApiEndpoint":"https://careers.lilly.com/widgets",
      "refNum":"LILLUS",
      "baseUrl":"https://careers.lilly.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","digital"],
      "selectedFields":{
        "country":["United States of America","United States"]
      },
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source. Searches Lilly United States technology roles before defensive engineering filters.'
  ),
  (
    'AbbVie',
    'abbvie.com',
    'scraper',
    'abbvie-attrax-technology',
    'https://careers.abbvie.com/en/jobs?q=technology&options=&page=1/jobs/',
    true,
    '{
      "adapter":"attrax",
      "publicBase":"https://careers.abbvie.com",
      "category":"Technology",
      "maxPages":4,
      "companyWebsite":"https://careers.abbvie.com/en/jobs"
    }'::jsonb,
    'Attrax source. Imports AbbVie United States technology roles from the requested keyword results page.'
  ),
  (
    'IBM',
    'ibm.com',
    'scraper',
    'ibm-careers-custom',
    'https://www.ibm.com/careers/search',
    false,
    '{
      "adapterNeeded":"ibm-careers-search",
      "scopeId":"careers2",
      "appId":"careers",
      "companyWebsite":"https://www.ibm.com/careers/search"
    }'::jsonb,
    'Disabled discovery row. IBM careers search is a custom embedded search app and currently renders its search function as temporarily unavailable for anonymous server-side inspection.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_type = EXCLUDED.source_type,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes,
  updated_at = now();
