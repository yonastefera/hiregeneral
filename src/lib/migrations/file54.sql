-- Enable Morgan Stanley technology jobs.
-- Morgan Stanley uses Eightfold. We keep this under source_type='scraper'
-- and select the Eightfold scraper adapter through metadata.

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
    'Morgan Stanley',
    'morganstanley.com',
    'scraper',
    'morgan-stanley-eightfold',
    'https://morganstanley.eightfold.ai/careers?domain=morganstanley.com',
    true,
    '{
      "adapter":"eightfold",
      "apiBase":"https://morganstanley.eightfold.ai",
      "domain":"morganstanley.com",
      "searchText":"technology",
      "location":"United States",
      "category":"Technology",
      "sortBy":"timestamp",
      "pageSize":10,
      "maxPages":10,
      "companyWebsite":"https://www.morganstanley.com/people-opportunities"
    }'::jsonb,
    'Eightfold source. Searches Morgan Stanley technology roles in the United States before defensive US/engineering filters.'
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
