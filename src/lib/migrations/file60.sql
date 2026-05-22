-- Add Target and Walmart official career sources for technology roles.

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
    'Target',
    'target.com',
    'scraper',
    'target-technology-careers',
    'https://corporate.target.com/careers/job-search?referral=job-search-link&currentPage=1&query=software&jobCategories=Corporate',
    true,
    '{
      "adapter":"target",
      "apiUrl":"https://corporate.target.com/api/jobsearch",
      "publicBase":"https://corporate.target.com",
      "companyWebsite":"https://corporate.target.com/careers",
      "searchTerms":["software","engineer","developer","technology"],
      "jobCategory":"Target Tech",
      "hierarchy":"Corporate",
      "maxPages":6,
      "category":"Technology"
    }'::jsonb,
    'Target corporate job search API. Imports US Target Tech and technology engineering roles.'
  ),
  (
    'Walmart',
    'walmart.com',
    'scraper',
    'walmart-careers-ai-search',
    'https://careers.walmart.com/us/en/results?searchQuery=software',
    true,
    '{
      "adapter":"walmart",
      "apiUrl":"https://careers.walmart.com/api/ai/search-ai/api/v1/combined/hybrid-search",
      "publicBase":"https://careers.walmart.com",
      "companyWebsite":"https://careers.walmart.com",
      "searchTerms":["software","developer","engineer","technology"],
      "pageSize":25,
      "maxPages":4,
      "locale":"en_US",
      "lang":"en",
      "category":"Technology"
    }'::jsonb,
    'Walmart careers AI search endpoint. Imports US software and technology roles after defensive engineering filters.'
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
