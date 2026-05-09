-- Add Ashby-backed AI/healthtech sources.

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
    'Jasper AI',
    'jasper.ai',
    'ashby',
    'Jasper AI',
    'https://jobs.ashbyhq.com/Jasper%20AI',
    true,
    '{"boardName":"Jasper AI","publicBase":"https://jobs.ashbyhq.com/Jasper%20AI"}'::jsonb,
    'Ashby source. Existing Ashby adapter filters to US engineering roles and removes internships.'
  ),
  (
    'Abridge',
    'abridge.com',
    'ashby',
    'Abridge',
    'https://jobs.ashbyhq.com/Abridge',
    true,
    '{"boardName":"Abridge","publicBase":"https://jobs.ashbyhq.com/Abridge"}'::jsonb,
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
