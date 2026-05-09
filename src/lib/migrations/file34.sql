-- Add EY as a SuccessFactors RSS source.

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
  'EY',
  'ey.com',
  'successfactors',
  'ey-successfactors',
  'https://careers.ey.com/ey/search/?q=software&locationsearch=United%20States&locale=en_US',
  true,
  '{
    "publicBase":"https://careers.ey.com/ey",
    "locale":"en_US",
    "searchText":"software",
    "locationSearch":"United States",
    "rssUrl":"https://careers.ey.com/services/rss/job/?locale=en_US&keywords=(software)%20AND%20locationSearch:(United%20States)"
  }'::jsonb,
  'SuccessFactors RSS source. Adapter imports US engineering roles and removes internships.'
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
