-- Add Manhattan Associates and record Frontline Education discovery.
-- Manhattan is a standard Workday source. Frontline's careers page returns a
-- Cloudflare challenge to the ingestion client, so it is recorded disabled
-- until we add a safe adapter or another first-party feed.

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
    'Manhattan Associates',
    'manh.com',
    'workday',
    'manhattan-associates-external',
    'https://manh.wd5.myworkdayjobs.com/en-US/External/jobs',
    true,
    '{
      "tenant":"manh",
      "site":"External",
      "apiBase":"https://manh.wd5.myworkdayjobs.com/wday/cxs/manh/External",
      "publicBase":"https://manh.wd5.myworkdayjobs.com/en-US/External",
      "searchTexts":["software","developer","engineer","technology","data","analytics","cloud","security"],
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Searches Manhattan Associates technology roles before defensive US/engineering filters.'
  ),
  (
    'Frontline Education',
    'frontlineeducation.com',
    'scraper',
    'frontline-education-careers',
    'https://careers.frontlineeducation.com/search/jobs',
    false,
    '{
      "adapterNeeded":"frontline-careers",
      "blockedBy":"cloudflare_challenge",
      "knownTechnologyPage":"https://careers.frontlineeducation.com/search/technology/jobs",
      "searchText":"technology",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery row. Frontline Education exposes technology roles publicly, but the careers site returns a Cloudflare challenge to server-side ingestion.'
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
