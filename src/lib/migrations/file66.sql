-- Add the next requested technology sources.
-- Experian and FedEx need small scraper adapters; Guidewire, HP, AEO, and
-- Allstate use existing platform adapters. Spotify and Shopify are kept as
-- disabled discovery rows until we map their current custom job data endpoints.

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
    'Experian',
    'experian.com',
    'scraper',
    'experian-attrax',
    'https://jobs.experian.com/jobs?options=1415%2C1416%2C1421%2C1412%2C1050&page=1&ln=&la=0&lo=0&lr=20&li=',
    true,
    '{
      "adapter":"attrax",
      "publicBase":"https://jobs.experian.com",
      "category":"Technology",
      "maxPages":4,
      "companyWebsite":"https://jobs.experian.com/jobs"
    }'::jsonb,
    'Attrax-style careers source. Imports Experian US technology/data roles from the requested filtered jobs page.'
  ),
  (
    'Guidewire',
    'guidewire.com',
    'workday',
    'guidewire-external',
    'https://wd5.myworkdaysite.com/recruiting/guidewire/external',
    true,
    '{
      "tenant":"guidewire",
      "site":"external",
      "apiBase":"https://wd5.myworkdaysite.com/wday/cxs/guidewire/external",
      "publicBase":"https://wd5.myworkdaysite.com/recruiting/guidewire/external",
      "searchTexts":["software","engineer","developer","data","security"],
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Searches Guidewire technology roles and keeps US roles through defensive filters.'
  ),
  (
    'FedEx',
    'fedex.com',
    'scraper',
    'fedex-professional-preload',
    'https://careers.fedex.com/career-areas/professional/jobs',
    false,
    '{
      "adapter":"fedex-preload",
      "category":"Technology",
      "companyWebsite":"https://careers.fedex.com/career-areas/professional/jobs"
    }'::jsonb,
    'Disabled discovery row. FedEx Paradox API currently denies server-side access; preload fallback does not expose enough US technology roles.'
  ),
  (
    'HP',
    'hp.com',
    'scraper',
    'hp-eightfold',
    'https://apply.hp.com/careers?domain=hp.com&query=software&location=United%20States',
    true,
    '{
      "adapter":"eightfold",
      "apiBase":"https://apply.hp.com",
      "domain":"hp.com",
      "searchText":"software",
      "location":"United States",
      "category":"Technology",
      "sortBy":"relevance",
      "pageSize":10,
      "maxPages":8,
      "companyWebsite":"https://jobs.hp.com/"
    }'::jsonb,
    'Eightfold source. Searches HP software roles in the United States before defensive US/engineering filters.'
  ),
  (
    'American Eagle Outfitters',
    'ae.com',
    'oracle_hcm',
    'aeo-careers',
    'https://hcml.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/AEO-Careers/jobs',
    true,
    '{
      "apiBase":"https://hcml.fa.us2.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
      "publicBase":"https://hcml.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/AEO-Careers/jobs",
      "siteNumber":"AEO-Careers",
      "searchTexts":["software","technology","engineer","data"],
      "countryCode":"US",
      "pageSize":50,
      "maxPages":4
    }'::jsonb,
    'Oracle HCM source. Searches AEO software/technology roles in the United States.'
  ),
  (
    'Allstate',
    'allstate.com',
    'scraper',
    'allstate-mcloud-technology',
    'https://www.allstate.jobs/job-search-results/?category[]=Data%2C%20Research%2C%20%26%20Strategy&category[]=Technology',
    true,
    '{
      "adapter":"mcloud",
      "apiBase":"https://jobsapi-internal.m-cloud.io/api",
      "organization":"2030",
      "category":"Technology",
      "facets":[
        "primary_category:Technology",
        "compliment:United States of America",
        "ats_portalid:Workday-MuleAPI-External",
        "is_internal:allstate_careers"
      ],
      "pageSize":50,
      "maxPages":4,
      "companyWebsite":"https://www.allstate.jobs/job-search-results/"
    }'::jsonb,
    'M-Cloud source. Imports Allstate US technology roles from the official careers endpoint.'
  ),
  (
    'Spotify',
    'spotify.com',
    'scraper',
    'spotify-careers-custom',
    'https://www.lifeatspotify.com/jobs?q=Creation+Platform&l=new-york&l=los-angeles&l=miami&l=washington-d-c&c=backend&c=client-c&c=data&c=developer-tools-infrastructure&c=engineering-leadership&c=machine-learning&c=mobile&c=network-engineering-it&c=security&c=tech-research&c=web&c=product',
    false,
    '{
      "adapterNeeded":"spotify-custom",
      "searchText":"Creation Platform",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery record. Spotify uses a custom Life at Spotify jobs app that needs a dedicated adapter before automated imports.'
  ),
  (
    'Shopify',
    'shopify.com',
    'scraper',
    'shopify-careers-custom',
    'https://www.shopify.com/careers',
    false,
    '{
      "adapterNeeded":"shopify-custom",
      "searchText":"engineering",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery record. Shopify embeds custom careers data on the public page; keep disabled until we add a safe custom adapter.'
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
