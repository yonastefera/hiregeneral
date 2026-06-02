-- Tighten Samsung and Intel Workday ingestion so one-source test runs finish
-- inside the API timeout while still covering software, technology, and data.

UPDATE public.job_sources
SET
  metadata = metadata || '{
    "searchTexts":["data engineer","data science","data analytics","software engineer","cloud security","technology"],
    "pageSize":20,
    "maxPages":2,
    "maxPostings":100,
    "detailConcurrency":3,
    "sourceTimeoutMs":180000
  }'::jsonb,
  notes = 'Workday source. Uses the requested United States location facet and targeted software, technology, security, and data searches with capped detail fetches.',
  updated_at = now()
WHERE source_type = 'workday'
  AND source_slug = 'samsung-workday-technology';

UPDATE public.job_sources
SET
  metadata = metadata || '{
    "searchTexts":["data engineer","data science","data analytics","software engineer","cloud security","technology"],
    "pageSize":20,
    "maxPages":2,
    "maxPostings":100,
    "detailConcurrency":3,
    "sourceTimeoutMs":180000
  }'::jsonb,
  notes = 'Workday source. Uses targeted software, technology, security, and data searches with capped detail fetches.',
  updated_at = now()
WHERE source_type = 'workday'
  AND source_slug = 'intel-workday-technology';
