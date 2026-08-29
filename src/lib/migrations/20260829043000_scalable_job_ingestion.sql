-- Phase 2 ingestion foundation: durable retries, dead letters, and atomic publish.
ALTER TABLE public.job_ingestion_runs
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dead_lettered BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quality_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

WITH ranked_running AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY source_name, source_slug ORDER BY started_at DESC, id DESC
    ) AS position
  FROM public.job_ingestion_runs
  WHERE status = 'running'
)
UPDATE public.job_ingestion_runs runs
SET status = 'failed',
    error_message = COALESCE(error_message, 'Superseded during worker migration'),
    finished_at = COALESCE(finished_at, now())
FROM ranked_running ranked
WHERE runs.id = ranked.id AND ranked.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_ingestion_runs_one_active_source
  ON public.job_ingestion_runs (source_name, source_slug)
  WHERE status = 'running';

CREATE TABLE IF NOT EXISTS public.job_ingestion_dead_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.job_ingestion_runs(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  company_name TEXT NOT NULL,
  attempt_count INTEGER NOT NULL CHECK (attempt_count > 0),
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (run_id)
);

CREATE INDEX IF NOT EXISTS idx_job_ingestion_dead_letters_open_created
  ON public.job_ingestion_dead_letters (created_at DESC)
  WHERE status = 'open';

ALTER TABLE public.job_ingestion_dead_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ingestion dead letters"
ON public.job_ingestion_dead_letters FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.job_ingestion_staging (
  run_id UUID NOT NULL REFERENCES public.job_ingestion_runs(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_slug TEXT NOT NULL,
  source_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  staged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (run_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_job_ingestion_staging_source
  ON public.job_ingestion_staging (source_name, source_slug, run_id);

ALTER TABLE public.job_ingestion_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ingestion staging"
ON public.job_ingestion_staging FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.publish_job_ingestion_stage(
  p_run_id UUID,
  p_expire_stale BOOLEAN
)
RETURNS TABLE (upserted_jobs INTEGER, expired_jobs INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run public.job_ingestion_runs%ROWTYPE;
  v_upserted INTEGER := 0;
  v_expired INTEGER := 0;
BEGIN
  SELECT * INTO v_run
  FROM public.job_ingestion_runs
  WHERE id = p_run_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown ingestion run';
  END IF;

  IF v_run.status <> 'running' THEN
    RAISE EXCEPTION 'Ingestion run is not publishable';
  END IF;

  INSERT INTO public.jobs (
    recruiter_id, company_id, company_name, company_logo_url, title, slug,
    description, location, latitude, longitude, employment_type, work_mode,
    salary_min, salary_max, salary_currency, skills, responsibilities,
    requirements, benefits, status, posted_at, expires_at, source_name,
    source_id, apply_url, experience_level, category, company_tagline,
    company_size, company_website
  )
  SELECT
    (s.payload->>'recruiterId')::uuid,
    NULLIF(s.payload->>'companyId', '')::uuid,
    s.payload->>'companyName',
    NULLIF(s.payload->>'companyLogoUrl', ''),
    s.payload->>'title',
    s.payload->>'slug',
    s.payload->>'description',
    s.payload->>'location',
    NULLIF(s.payload->>'latitude', '')::numeric,
    NULLIF(s.payload->>'longitude', '')::numeric,
    s.payload->>'employmentType',
    s.payload->>'workMode',
    NULLIF(s.payload->>'salaryMin', '')::integer,
    NULLIF(s.payload->>'salaryMax', '')::integer,
    s.payload->>'salaryCurrency',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(s.payload->'skills', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(s.payload->'responsibilities', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(s.payload->'requirements', '[]'::jsonb))),
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(s.payload->'benefits', '[]'::jsonb))),
    'published'::public.job_status,
    (s.payload->>'postedAt')::timestamptz,
    NULLIF(s.payload->>'expiresAt', '')::timestamptz,
    s.source_name,
    s.source_id,
    s.payload->>'applyUrl',
    NULLIF(s.payload->>'experienceLevel', ''),
    NULLIF(s.payload->>'category', ''),
    NULLIF(s.payload->>'companyTagline', ''),
    NULLIF(s.payload->>'companySize', ''),
    NULLIF(s.payload->>'companyWebsite', '')
  FROM public.job_ingestion_staging s
  WHERE s.run_id = p_run_id
    AND s.source_name = v_run.source_name
    AND s.source_slug = v_run.source_slug
  ON CONFLICT (source_name, source_id) DO UPDATE SET
    recruiter_id = EXCLUDED.recruiter_id,
    company_id = EXCLUDED.company_id,
    company_name = EXCLUDED.company_name,
    company_logo_url = EXCLUDED.company_logo_url,
    title = EXCLUDED.title,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    employment_type = EXCLUDED.employment_type,
    work_mode = EXCLUDED.work_mode,
    salary_min = EXCLUDED.salary_min,
    salary_max = EXCLUDED.salary_max,
    salary_currency = EXCLUDED.salary_currency,
    skills = EXCLUDED.skills,
    responsibilities = EXCLUDED.responsibilities,
    requirements = EXCLUDED.requirements,
    benefits = EXCLUDED.benefits,
    status = EXCLUDED.status,
    posted_at = EXCLUDED.posted_at,
    expires_at = EXCLUDED.expires_at,
    apply_url = EXCLUDED.apply_url,
    experience_level = EXCLUDED.experience_level,
    category = EXCLUDED.category,
    company_tagline = EXCLUDED.company_tagline,
    company_size = EXCLUDED.company_size,
    company_website = EXCLUDED.company_website,
    updated_at = now();

  GET DIAGNOSTICS v_upserted = ROW_COUNT;

  IF p_expire_stale THEN
    UPDATE public.jobs j
    SET status = 'closed', expires_at = now(), updated_at = now()
    WHERE j.source_name = v_run.source_name
      AND j.source_id LIKE v_run.source_slug || ':%'
      AND j.status = 'published'
      AND NOT EXISTS (
        SELECT 1
        FROM public.job_ingestion_staging s
        WHERE s.run_id = p_run_id
          AND s.source_id = j.source_id
      );

    GET DIAGNOSTICS v_expired = ROW_COUNT;
  END IF;

  DELETE FROM public.job_ingestion_staging WHERE run_id = p_run_id;

  UPDATE public.job_ingestion_runs
  SET published_at = now()
  WHERE id = p_run_id;

  RETURN QUERY SELECT v_upserted, v_expired;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_job_ingestion_stage(UUID, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_job_ingestion_stage(UUID, BOOLEAN)
  TO service_role;
