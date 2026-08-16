-- Read-only production plan for the default public jobs feed.
-- Mirrors the API's 30-day active/published filter, newest-first ordering,
-- and 1,000-row candidate cap used before company diversification.

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
ORDER BY posted_at DESC
LIMIT 1000;
