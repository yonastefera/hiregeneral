-- Read-only production plan for the employer candidate-list join.
-- Uses the representative recruiter captured by production preflight.

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
  application.id,
  application.applicant_email,
  application.applicant_full_name,
  application.applicant_location,
  application.created_at,
  application.resume_url,
  application.status,
  application.user_id,
  application.years_experience,
  job.id AS job_id,
  job.title AS job_title
FROM public.applications AS application
JOIN public.jobs AS job
  ON job.id = application.job_id
WHERE job.recruiter_id = '5805316a-947a-4067-af11-3c51067981ff'::uuid
ORDER BY application.created_at DESC
LIMIT 200;
