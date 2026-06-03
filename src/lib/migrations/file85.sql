-- Add Nordstrom Corporate technology and data roles from its Paradox preload careers page.

UPDATE public.job_sources
SET
  company_name = 'Nordstrom',
  company_domain = 'nordstrom.com',
  source_type = 'scraper',
  source_url = 'https://careers.nordstrom.com/jobs?filter%5Bcf_career_site_category%5D%5B0%5D=Corporate&filter%5Bcf_career_site_sub_category%5D%5B0%5D=Data%20Science%20%26%20Analytics&filter%5Bcf_career_site_sub_category%5D%5B1%5D=Technology%20%26%20Product',
  enabled = true,
  metadata = '{
    "adapter":"paradox-preload",
    "category":"Technology",
    "companyWebsite":"https://careers.nordstrom.com/jobs",
    "maxPages":4
  }'::jsonb,
  notes = 'Paradox preload source. Imports US Corporate Technology & Product plus Data Science & Analytics roles and removes internships.',
  updated_at = now()
WHERE source_slug = 'nordstrom-paradox-technology-data';

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
SELECT
  'Nordstrom',
  'nordstrom.com',
  'scraper',
  'nordstrom-paradox-technology-data',
  'https://careers.nordstrom.com/jobs?filter%5Bcf_career_site_category%5D%5B0%5D=Corporate&filter%5Bcf_career_site_sub_category%5D%5B0%5D=Data%20Science%20%26%20Analytics&filter%5Bcf_career_site_sub_category%5D%5B1%5D=Technology%20%26%20Product',
  true,
  '{
    "adapter":"paradox-preload",
    "category":"Technology",
    "companyWebsite":"https://careers.nordstrom.com/jobs",
    "maxPages":4
  }'::jsonb,
  'Paradox preload source. Imports US Corporate Technology & Product plus Data Science & Analytics roles and removes internships.'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.job_sources
  WHERE source_slug = 'nordstrom-paradox-technology-data'
);
