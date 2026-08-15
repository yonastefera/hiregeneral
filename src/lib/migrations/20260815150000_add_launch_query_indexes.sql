-- Forward-only indexes for launch-critical authenticated query shapes.

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_created_at
ON public.jobs (recruiter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_status_created_at
ON public.jobs (recruiter_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_user_created_at
ON public.applications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_job_created_at
ON public.applications (job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_one_activity
ON public.conversations (participant_one, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_two_activity
ON public.conversations (participant_two, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_created_at
ON public.saved_jobs (user_id, created_at DESC);
