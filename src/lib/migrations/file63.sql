-- Refresh Home Depot technology coverage and keep Delta documented as blocked.

UPDATE public.job_sources
SET
  enabled = true,
  metadata = '{
    "adapter":"mcloud",
    "apiBase":"https://jobsapi-internal.m-cloud.io/api",
    "organization":"1814",
    "category":"Technology",
    "facets":[
      "primary_category:Technology",
      "ats_portalid:KBR-5032~Workday~Paycom"
    ],
    "pageSize":50,
    "maxPages":8,
    "companyWebsite":"https://careers.homedepot.com/job-search-results/?category[]=Technology"
  }'::jsonb,
  notes = 'M-Cloud/CWS source. Uses the Technology facet before defensive US/engineering filters; widened to eight pages for better coverage.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'home-depot-mcloud-technology';

UPDATE public.job_sources
SET
  enabled = false,
  metadata = '{
    "adapterNeeded":"avature",
    "waf":"aws_challenge",
    "searchText":"technology",
    "country":"United States",
    "lastChecked":"2026-05-22"
  }'::jsonb,
  notes = 'Disabled for now. Delta careers is Avature and still returns an AWS WAF challenge to server-side fetches.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'delta-avature-careers';
