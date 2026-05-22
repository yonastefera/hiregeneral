-- Add Cisco and Yahoo official career sources for technology roles.

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
    'Cisco',
    'cisco.com',
    'phenom',
    'cisco-phenom',
    'https://careers.cisco.com/global/en/search-results',
    true,
    '{
      "widgetApiEndpoint":"https://careers.cisco.com/widgets",
      "refNum":"CISCISGLOBAL",
      "baseUrl":"https://careers.cisco.com/global/en",
      "locale":"en_global",
      "country":"global",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology"],
      "selectedFields":{"country":["United States of America"]},
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Cisco Phenom source. Imports United States technology roles from Cisco Careers.'
  ),
  (
    'Yahoo',
    'yahooinc.com',
    'scraper',
    'yahoo-careers',
    'https://www.yahooinc.com/careers/search.html',
    true,
    '{
      "adapter":"yahoo",
      "apiUrl":"https://www.yahooinc.com/careers/calls/makeVespaCalls.php",
      "companyWebsite":"https://www.yahooinc.com/careers/",
      "searchTerms":["software","engineer","developer","technology"],
      "jobCategories":["Software Development","Engineering","Information Systems"],
      "pageSize":20,
      "maxPages":5,
      "category":"Technology"
    }'::jsonb,
    'Yahoo first-party careers search endpoint. Imports US software, engineering, and information systems roles.'
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
