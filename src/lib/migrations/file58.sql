-- Add the next batch of employer technology sources.
-- AT&T uses Workday, Starbucks uses Eightfold, and FanDuel/Samsara use
-- Greenhouse. SiriusXM is recorded disabled until we add a Jibe adapter.

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
    'AT&T',
    'att.com',
    'workday',
    'att-general',
    'https://att.wd1.myworkdayjobs.com/en-US/ATTGeneral',
    true,
    '{
      "tenant":"att",
      "site":"ATTGeneral",
      "publicBase":"https://att.wd1.myworkdayjobs.com/en-US/ATTGeneral",
      "searchText":"software",
      "pageSize":20,
      "maxPages":8
    }'::jsonb,
    'Workday source. Searches AT&T software roles before defensive US/engineering filters.'
  ),
  (
    'Starbucks',
    'starbucks.com',
    'scraper',
    'starbucks-eightfold',
    'https://starbucks.eightfold.ai/careers?domain=starbucks.com&query=software&location=United%20States',
    true,
    '{
      "adapter":"eightfold",
      "apiBase":"https://starbucks.eightfold.ai",
      "domain":"starbucks.com",
      "searchText":"software",
      "location":"United States",
      "category":"Technology",
      "sortBy":"relevance",
      "pageSize":10,
      "maxPages":8,
      "companyWebsite":"https://www.starbucks.com/careers/"
    }'::jsonb,
    'Eightfold source. Searches Starbucks software roles in the United States before defensive US/engineering filters.'
  ),
  (
    'FanDuel',
    'fanduel.com',
    'greenhouse',
    'fanduel',
    'https://www.fanduel.careers/open-positions/?keys=software',
    true,
    '{
      "publicBase":"https://www.fanduel.careers/open-positions/"
    }'::jsonb,
    'Greenhouse source. Imports FanDuel roles and relies on defensive US/engineering filters.'
  ),
  (
    'Samsara',
    'samsara.com',
    'greenhouse',
    'samsara',
    'https://www.samsara.com/company/careers/roles',
    true,
    '{
      "publicBase":"https://www.samsara.com/company/careers/roles"
    }'::jsonb,
    'Greenhouse source. Imports Samsara roles and relies on defensive US/engineering filters.'
  ),
  (
    'SiriusXM',
    'siriusxm.com',
    'scraper',
    'siriusxm-jibe',
    'https://careers.siriusxm.com/careers/jobs?keywords=software%20',
    false,
    '{
      "adapterNeeded":"jibe",
      "searchText":"software",
      "country":"United States"
    }'::jsonb,
    'Disabled discovery record. SiriusXM uses a Jibe-style careers search that needs a dedicated adapter.'
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
