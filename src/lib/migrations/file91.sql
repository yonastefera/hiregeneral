-- Add Voya and Berkley sources; loosen AmTrust iCIMS filtering after zero-job test.

WITH sources (
  company_name,
  company_domain,
  source_type,
  source_slug,
  source_url,
  enabled,
  metadata,
  notes
) AS (
  VALUES
    (
      'Voya Financial',
      'voya.com',
      'workday',
      'voya-workday-technology',
      'https://godirect.wd5.myworkdayjobs.com/voya_jobs',
      true,
      '{
        "tenant":"godirect",
        "site":"voya_jobs",
        "apiBase":"https://godirect.wd5.myworkdayjobs.com/wday/cxs/godirect/voya_jobs",
        "publicBase":"https://godirect.wd5.myworkdayjobs.com/voya_jobs",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","data governance","cloud","security","ai"],
        "pageSize":20,
        "maxPages":8,
        "maxPostings":120
      }'::jsonb,
      'Workday source. Searches Voya Financial software, technology, data, analytics, cloud, security, and AI roles.'
    ),
    (
      'Berkley',
      'berkley.com',
      'scraper',
      'berkley-icims-technology',
      'https://careers-berkley.icims.com/jobs/search?ss=1&searchCategory=8730',
      true,
      '{
        "adapter":"icims",
        "publicBase":"https://careers-berkley.icims.com",
        "searchUrl":"https://careers-berkley.icims.com/jobs/search?ss=1&searchCategory=8730",
        "category":"Technology",
        "companyWebsite":"https://careers-berkley.icims.com/jobs/search",
        "maxJobs":50
      }'::jsonb,
      'iCIMS source. Imports Berkley United States engineering and technology roles from category 8730.'
    ),
    (
      'AmTrust Financial Services',
      'amtrustfinancial.com',
      'scraper',
      'amtrust-icims-technology',
      'https://careers-amtrustgroup.icims.com/jobs/search?ss=1&searchCategory=8730&searchLocation=12781--',
      true,
      '{
        "adapter":"icims",
        "publicBase":"https://careers-amtrustgroup.icims.com",
        "searchUrl":"https://careers-amtrustgroup.icims.com/jobs/search?ss=1&searchCategory=8730&searchLocation=12781--",
        "category":"Technology",
        "companyWebsite":"https://careers-amtrustgroup.icims.com/jobs/search",
        "maxJobs":50
      }'::jsonb,
      'iCIMS source. Removes the previous all-terms required filter that caused zero AmTrust jobs; category 8730 and ingestion filters still keep the feed technology-focused.'
    )
),
updated AS (
  UPDATE public.job_sources AS job_sources
  SET
    company_name = sources.company_name,
    company_domain = sources.company_domain,
    source_type = sources.source_type,
    source_url = sources.source_url,
    enabled = sources.enabled,
    metadata = sources.metadata,
    notes = sources.notes
  FROM sources
  WHERE job_sources.source_slug = sources.source_slug
  RETURNING job_sources.source_slug
)
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
  sources.company_name,
  sources.company_domain,
  sources.source_type,
  sources.source_slug,
  sources.source_url,
  sources.enabled,
  sources.metadata,
  sources.notes
FROM sources
WHERE NOT EXISTS (
  SELECT 1
  FROM updated
  WHERE updated.source_slug = sources.source_slug
);
