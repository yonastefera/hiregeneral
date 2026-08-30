-- Phase 3: user-owned saved searches with durable, deduplicated alert delivery.
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  query TEXT NOT NULL DEFAULT '' CHECK (char_length(query) <= 200),
  location TEXT NOT NULL DEFAULT '' CHECK (char_length(location) <= 160),
  posted_days INTEGER NOT NULL DEFAULT 30 CHECK (posted_days BETWEEN 1 AND 3650),
  distance_miles INTEGER NOT NULL DEFAULT 100 CHECK (distance_miles BETWEEN 1 AND 100),
  work_mode TEXT NOT NULL DEFAULT '' CHECK (work_mode IN ('', 'Remote', 'Hybrid', 'On-site')),
  easy_apply BOOLEAN NOT NULL DEFAULT false,
  alert_frequency TEXT NOT NULL DEFAULT 'weekly'
    CHECK (alert_frequency IN ('off', 'daily', 'weekly')),
  last_alerted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_saved_searches_due_alerts
  ON public.saved_searches (alert_frequency, last_alerted_at)
  WHERE alert_frequency <> 'off';

CREATE INDEX idx_saved_searches_user_updated
  ON public.saved_searches (user_id, updated_at DESC);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their saved searches"
ON public.saved_searches FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.saved_search_alert_jobs (
  saved_search_id UUID NOT NULL REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (saved_search_id, job_id)
);

CREATE INDEX idx_saved_search_alert_jobs_delivered
  ON public.saved_search_alert_jobs (delivered_at DESC);

ALTER TABLE public.saved_search_alert_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their saved search alert history"
ON public.saved_search_alert_jobs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.saved_searches
    WHERE saved_searches.id = saved_search_alert_jobs.saved_search_id
      AND saved_searches.user_id = auth.uid()
  )
);
