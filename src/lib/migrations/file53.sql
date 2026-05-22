-- Add The Home Depot technology job source.
-- Home Depot uses Findly/CWS M-Cloud. The scraper adapter calls the public
-- JSON endpoint with the Technology facet, then applies US + technology filters.

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
    'The Home Depot',
    'homedepot.com',
    'scraper',
    'home-depot-mcloud-technology',
    'https://careers.homedepot.com/job-search-results/?category[]=Technology',
    true,
    '{
      "adapter":"mcloud",
      "apiBase":"https://jobsapi-internal.m-cloud.io/api",
      "organization":"1814",
      "category":"Technology",
      "facets":[
        "primary_category:Technology",
        "ats_portalid:KBR-5032~Workday~Paycom"
      ],
      "pageSize":50,
      "maxPages":4,
      "companyWebsite":"https://careers.homedepot.com/job-search-results/?category[]=Technology"
    }'::jsonb,
    'M-Cloud/CWS source. Uses the Technology facet before defensive US/engineering filters.'
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
