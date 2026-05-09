-- Add Notion as an Ashby source.

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
  'Notion',
  'notion.com',
  'ashby',
  'notion',
  'https://jobs.ashbyhq.com/notion',
  true,
  '{"boardName":"notion","publicBase":"https://jobs.ashbyhq.com/notion"}'::jsonb,
  'Ashby source. Existing Ashby adapter filters to US engineering roles and removes internships.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
