-- Enable Burlington's NLX/Solr careers source for Information Technology roles.

UPDATE public.job_sources
SET
  source_type = 'scraper',
  source_url = 'https://burlingtonstores.jobs/position-category/information-technology/jobs/',
  enabled = true,
  metadata = '{
    "adapter":"nlx-solr",
    "apiBase":"https://prod-search-api.jobsyn.org/api",
    "endpoint":"v1/solr/search",
    "origin":"burlingtonstores.jobs",
    "buids":["56690","57940"],
    "categorySlug":"information-technology",
    "category":"Information Technology",
    "searchTerms":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","cybersecurity","AI"],
    "pageSize":10,
    "maxPages":4,
    "companyWebsite":"https://burlingtonstores.jobs/position-category/information-technology/jobs/"
  }'::jsonb,
  notes = 'NLX/Solr source. Imports Burlington information technology, software, data, AI, cloud, and cybersecurity roles from the public DirectEmployers search API.',
  updated_at = now()
WHERE source_type = 'scraper'
  AND source_slug = 'burlington-nlx-solr-technology';
