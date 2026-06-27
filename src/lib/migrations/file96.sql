-- Refresh Netflix and Mozilla ingestion settings.
-- Uses update-then-insert instead of ON CONFLICT because job_sources does not
-- have a unique constraint for the conflict target in every environment.

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
      'Netflix',
      'netflix.com',
      'scraper',
      'netflix-eightfold',
      'https://explore.jobs.netflix.net/careers?location=United%20States&domain=netflix.com&sort_by=relevance&triggerGoButton=true',
      true,
      '{
        "adapter":"eightfold",
        "apiBase":"https://explore.jobs.netflix.net",
        "domain":"netflix.com",
        "searchTexts":["software","developer","engineer","technology","data","analytics","data science","data engineering","machine learning","security","platform","cloud","product"],
        "requiredTerms":["software","developer","engineer","engineering","data","analytics","data science","data engineering","machine learning","ml","ai","platform","security","cloud","technical","technology","product manager","product management"],
        "location":"United States",
        "category":"Technology",
        "sortBy":"relevance",
        "pageSize":10,
        "maxPages":5,
        "sourceTimeoutMs":120000,
        "fetchDetails":false,
        "enhanceDetails":false,
        "companyWebsite":"https://jobs.netflix.com"
      }'::jsonb,
      'Eightfold source. Uses the generic embedded-page fallback when the public API returns an empty/error JSON response and keeps results focused on United States technology, software, data, AI, platform, cloud, security, and product roles.'
    ),
    (
      'Mozilla',
      'mozilla.org',
      'scraper',
      'mozilla',
      'https://www.mozilla.org/en-US/careers/feed/',
      true,
      '{
        "adapter":"atom-feed",
        "feedUrl":"https://www.mozilla.org/en-US/careers/feed/",
        "publicBase":"https://www.mozilla.org",
        "locationFallback":"United States",
        "category":"Technology",
        "companyWebsite":"https://www.mozilla.org/en-US/careers/listings/",
        "maxJobs":80,
        "requireUs":false,
        "requireEngineering":false,
        "excludedTerms":["student worker"],
        "enhanceDetails":false
      }'::jsonb,
      'Atom/RSS feed source. Imports the current Mozilla careers feed broadly, skips student-worker postings, and avoids slow detail-page enhancement so feed counts stay stable.'
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
    notes = sources.notes,
    updated_at = now()
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
