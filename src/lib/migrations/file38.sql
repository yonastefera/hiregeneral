-- Store AI-generated presentation fields separately from source job data.

CREATE TABLE IF NOT EXISTS public.job_enrichments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  display_title text NOT NULL,
  display_location text NOT NULL,
  location_count integer NOT NULL DEFAULT 1 CHECK (location_count >= 0),
  summary text NOT NULL,
  about_role text NOT NULL,
  responsibilities text[] NOT NULL DEFAULT '{}',
  requirements text[] NOT NULL DEFAULT '{}',
  benefits text[] NOT NULL DEFAULT '{}',
  quality_flags text[] NOT NULL DEFAULT '{}',
  confidence numeric(4, 3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'failed')),
  error_message text,
  model text NOT NULL,
  prompt_version text NOT NULL,
  source_updated_at timestamptz,
  enriched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_enrichments_job_id_key UNIQUE (job_id)
);

CREATE INDEX IF NOT EXISTS job_enrichments_status_idx
  ON public.job_enrichments (status);

CREATE INDEX IF NOT EXISTS job_enrichments_updated_idx
  ON public.job_enrichments (updated_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_job_enrichments_updated_at'
  ) THEN
    CREATE TRIGGER set_job_enrichments_updated_at
    BEFORE UPDATE ON public.job_enrichments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
