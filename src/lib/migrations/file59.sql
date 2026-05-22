-- Add approved direct sources from the Kforce lead notebook.
-- These are official company career boards only; no Kforce agency postings are
-- imported. Home Depot was already live via file53.

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
    'Mastercard',
    'mastercard.com',
    'phenom',
    'mastercard-phenom',
    'https://careers.mastercard.com/us/en/c/software-engineering-jobs',
    true,
    '{
      "widgetApiEndpoint":"https://careers.mastercard.com/widgets",
      "refNum":"MASRUS",
      "baseUrl":"https://careers.mastercard.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology"],
      "selectedFields":{
        "category":["Engineering","AI & Data","Cyber and Corporate Security","Product Management"]
      },
      "pageSize":50,
      "maxPages":6,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source approved from the Kforce lead notebook. Searches official Mastercard technology/engineering roles only.'
  ),
  (
    'FIS',
    'fisglobal.com',
    'phenom',
    'fis-phenom',
    'https://careers.fisglobal.com/us/en/search-results',
    true,
    '{
      "widgetApiEndpoint":"https://careers.fisglobal.com/widgets",
      "refNum":"FIGLUS",
      "baseUrl":"https://careers.fisglobal.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology"],
      "selectedFields":{
        "category":["Product Development","Information Technology"]
      },
      "pageSize":50,
      "maxPages":5,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source approved from the Kforce lead notebook. Searches official FIS product development and IT roles.'
  ),
  (
    'Lowe''s',
    'lowes.com',
    'phenom',
    'lowes-technology-phenom',
    'https://talent.lowes.com/us/en/c/technology-jobs',
    true,
    '{
      "widgetApiEndpoint":"https://talent.lowes.com/widgets",
      "refNum":"LOWEUS",
      "baseUrl":"https://talent.lowes.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"category",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology"],
      "selectedFields":{
        "category":["Technology"]
      },
      "pageSize":25,
      "maxPages":3,
      "preferPublicJobUrl":true
    }'::jsonb,
    'Phenom source approved from the Kforce lead notebook. Uses Lowe''s official Technology category before defensive US/engineering filters.'
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
