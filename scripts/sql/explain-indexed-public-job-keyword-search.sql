-- Read-only post-fix plan for the consolidated public keyword search.
-- Compare with explain-public-job-keyword-search.sql (601.275 ms baseline).

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
  id,
  title,
  company_name,
  location,
  posted_at,
  expires_at
FROM public.jobs
WHERE status = 'published'
  AND posted_at >= now() - interval '30 days'
  AND (expires_at IS NULL OR expires_at > now())
  AND search_text ILIKE '%software%'
ORDER BY posted_at DESC
LIMIT 1000;
