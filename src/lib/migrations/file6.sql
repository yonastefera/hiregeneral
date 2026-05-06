-- Tracks every source-level ingestion attempt for debugging and operations.
CREATE TABLE IF NOT EXISTS public.job_ingestion_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'failed')),
  fetched_jobs INTEGER NOT NULL DEFAULT 0,
  valid_jobs INTEGER NOT NULL DEFAULT 0,
  rejected_jobs INTEGER NOT NULL DEFAULT 0,
  upserted_jobs INTEGER NOT NULL DEFAULT 0,
  expired_jobs INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_ingestion_runs_source_started
  ON public.job_ingestion_runs (source_name, source_slug, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_ingestion_runs_status
  ON public.job_ingestion_runs (status);

ALTER TABLE public.job_ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ingestion runs"
ON public.job_ingestion_runs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
