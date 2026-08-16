-- Read-only production plan for a representative public keyword search.
-- Mirrors the API's four-field ILIKE search plus the 30-day active filter.

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
  AND (
    title ILIKE '%software%'
    OR company_name ILIKE '%software%'
    OR description ILIKE '%software%'
    OR category ILIKE '%software%'
  )
ORDER BY posted_at DESC
LIMIT 1000;
