-- Add United Airlines and CVS Health as Phenom sources.

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
    'United Airlines',
    'united.com',
    'phenom',
    'united-airlines-phenom',
    'https://careers.united.com/us/en/search-results?keywords=software',
    true,
    '{
      "widgetApiEndpoint":"https://careers.united.com/widgets",
      "refNum":"UAIUADUS",
      "baseUrl":"https://careers.united.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology"],
      "pageSize":50,
      "maxPages":4
    }'::jsonb,
    'Phenom source. Adapter imports US engineering roles and removes internships.'
  ),
  (
    'CVS Health',
    'cvshealth.com',
    'phenom',
    'cvs-health-phenom',
    'https://jobs.cvshealth.com/us/en/search-results?keywords=software',
    true,
    '{
      "widgetApiEndpoint":"https://jobs.cvshealth.com/widgets",
      "refNum":"CVSCHLUS",
      "baseUrl":"https://jobs.cvshealth.com/us/en",
      "locale":"en_us",
      "country":"us",
      "pageName":"search-results",
      "siteType":"external",
      "searchTerms":["software","developer","engineer","technology"],
      "pageSize":50,
      "maxPages":5
    }'::jsonb,
    'Phenom source. Adapter imports US engineering roles and removes internships.'
  )
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled,
  metadata = EXCLUDED.metadata,
  notes = EXCLUDED.notes;
