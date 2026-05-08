-- Add Red Ventures as a Greenhouse source.

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
  'Red Ventures',
  'redventures.com',
  'greenhouse',
  'redventures',
  'https://job-boards.greenhouse.io/redventures',
  true,
  '{"publicBase":"https://job-boards.greenhouse.io/redventures"}'::jsonb,
  'Greenhouse source. Existing Greenhouse adapter filters to US engineering roles and removes internships/duplicate-looking roles.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
