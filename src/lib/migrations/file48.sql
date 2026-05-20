-- Broaden Bank of America Workday ingestion to cover IT roles beyond the
-- single "technology" search term.

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
VALUES (
  'Bank of America',
  'bankofamerica.com',
  'workday',
  'Lateral-US',
  'https://ghr.wd1.myworkdayjobs.com/en-US/Lateral-US',
  true,
  '{
    "tenant":"ghr",
    "site":"Lateral-US",
    "publicBase":"https://ghr.wd1.myworkdayjobs.com/en-US/Lateral-US",
    "searchText":"technology",
    "searchTexts":[
      "technology",
      "information technology",
      "software",
      "software engineer",
      "developer",
      "application",
      "platform",
      "systems",
      "cloud",
      "cybersecurity",
      "security",
      "data",
      "database",
      "network",
      "infrastructure",
      "architect",
      "digital",
      "api"
    ],
    "pageSize":20,
    "maxPages":20
  }'::jsonb,
  'Workday source. Uses a broad Bank of America IT keyword batch before US/engineering filters so software, security, cloud, data, network, systems, and platform roles are not missed.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
