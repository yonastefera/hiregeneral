-- Read-only production plan for the authenticated saved-jobs list.
-- Uses the representative user captured by production preflight.

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
  saved.id,
  saved.created_at,
  job.id AS job_id,
  job.title,
  job.company_name,
  job.location,
  job.status,
  job.slug,
  job.posted_at
FROM public.saved_jobs AS saved
JOIN public.jobs AS job
  ON job.id = saved.job_id
WHERE saved.user_id = '112aa9e6-3504-44d3-9d2d-d9ea22ec74dc'::uuid
ORDER BY saved.created_at DESC;
