-- Add the next batch of technology job sources.
-- Chewy and Hilton use Phenom. Marriott is backed by Oracle HCM.
-- Delta is recorded disabled because its Avature site is currently behind an AWS WAF challenge.

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
    'Chewy',
    'chewy.com',
    'phenom',
    'chewy-phenom',
    'https://careers.chewy.com/us/en/search-results?keywords=software',
    true,
    '{
      "widgetApiEndpoint":"https://careers.chewy.com/widgets",
      "refNum":"CHINUS",
      "baseUrl":"https://careers.chewy.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data"],
      "selectedFields":{"category":["Technology"]},
      "pageSize":50,
      "maxPages":5
    }'::jsonb,
    'Phenom source narrowed to Chewy technology roles before US/engineering filters.'
  ),
  (
    'Delta Air Lines',
    'delta.com',
    'scraper',
    'delta-avature-careers',
    'https://delta.avature.net/en_US/careers',
    false,
    '{
      "adapterNeeded":"avature",
      "waf":"aws_challenge",
      "searchText":"technology",
      "country":"United States"
    }'::jsonb,
    'Disabled for now. Delta careers is Avature and returned an AWS WAF challenge during adapter discovery.'
  ),
  (
    'Hilton',
    'hilton.com',
    'phenom',
    'hilton-phenom',
    'https://jobs.hilton.com/us/en/search-results?keywords=software',
    true,
    '{
      "widgetApiEndpoint":"https://jobs.hilton.com/widgets",
      "refNum":"HILTGLOBAL",
      "baseUrl":"https://jobs.hilton.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology","data"],
      "selectedFields":{"subCategory":["Technology"],"country":["United States"]},
      "pageSize":50,
      "maxPages":5
    }'::jsonb,
    'Phenom source narrowed to Hilton technology roles before US/engineering filters.'
  ),
  (
    'Marriott International',
    'marriott.com',
    'oracle_hcm',
    'marriott-mi-cs-1',
    'https://careers.marriott.com/jobs?filter%5Bcategory%5D%5B0%5D=Information%20Technology&filter%5Bcountry%5D%5B0%5D=United%20States',
    true,
    '{
      "apiBase":"https://ejwl.fa.us2.oraclecloud.com/hcmRestApi/resources/11.13.18.05",
      "publicBase":"https://ejwl.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/MI_CS_1",
      "siteNumber":"MI_CS_1",
      "searchText":"Information Technology",
      "countryCode":"US"
    }'::jsonb,
    'Oracle HCM source for Marriott Information Technology roles in the United States before engineering filters.'
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
  notes = 'Superseded by the enabled marriott-mi-cs-1 Oracle HCM source.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'marriott-careers';
