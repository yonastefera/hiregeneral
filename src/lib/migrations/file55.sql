-- Add Fannie Mae, Cardinal Health, Humana, and Southern Company job sources.
-- Southern Company is stored as a disabled placeholder until its NLX/Solr
-- endpoint is implemented.

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
    'Fannie Mae',
    'fanniemae.com',
    'workday',
    'fannie-mae-careers',
    'https://fanniemae.wd1.myworkdayjobs.com/en-US/FannieMaeCareers',
    true,
    '{
      "tenant":"fanniemae",
      "site":"FannieMaeCareers",
      "publicBase":"https://fanniemae.wd1.myworkdayjobs.com/en-US/FannieMaeCareers",
      "searchText":"technology",
      "pageSize":20,
      "maxPages":10
    }'::jsonb,
    'Workday source. Search is narrowed to technology roles before defensive US/engineering filters.'
  ),
  (
    'Cardinal Health',
    'cardinalhealth.com',
    'scraper',
    'cardinal-health-activate-it',
    'https://jobs.cardinalhealth.com/career-areas/information',
    true,
    '{
      "adapter":"activate",
      "category":"Information Technology",
      "categoryIds":[
        "869EECE2-5EBE-481C-8170-E72BAB63214F",
        "b0b9c149-229a-4c89-b2b6-cecbc712922d",
        "d79cfe6e-7e1a-4904-b57c-c04b0758b421",
        "901ae6ca-91a9-403a-9402-bc2fbc705e2b"
      ],
      "pageSize":12,
      "maxPages":5,
      "companyWebsite":"https://jobs.cardinalhealth.com/career-areas/information"
    }'::jsonb,
    'Activate/Radancy-style careers source. Scraper imports US technology roles from listing JSON and detail JobPosting schema.'
  ),
  (
    'Humana',
    'humana.com',
    'phenom',
    'humana-phenom',
    'https://careers.humana.com/us/en/c/technology-and-digital-analytics-jobs',
    true,
    '{
      "widgetApiEndpoint":"https://careers.humana.com/widgets",
      "refNum":"HUMHUMUS",
      "baseUrl":"https://careers.humana.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data","analytics"],
      "selectedFields":{"category":["Technology and Digital Analytics"]},
      "pageSize":50,
      "maxPages":5
    }'::jsonb,
    'Phenom source. Searches Humana Technology and Digital Analytics roles before defensive US/engineering filters.'
  ),
  (
    'Southern Company',
    'southerncompany.com',
    'scraper',
    'southern-company-nlx-solr-atlanta',
    'https://southerncompany.jobs/locations/atlanta-ga/jobs/',
    false,
    '{
      "adapterNeeded":"nlx_solr",
      "jobFolder":"southerncompany-jobs",
      "origin":"southerncompany.jobs",
      "buids":[57624,44229],
      "location":"Atlanta, GA",
      "searchText":"technology",
      "solrQueries":[
        "text:\"Job Category: Information Technology\"",
        "text:\"Job Category: Cybersecurity\"",
        "text:\"Job Category: Data Analytics\""
      ]
    }'::jsonb,
    'Disabled discovery record. Southern Company exposes NLX/Solr config in the client app, but the stable jobs endpoint still needs a dedicated adapter.'
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
