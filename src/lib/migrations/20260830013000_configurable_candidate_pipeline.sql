-- Employer-owned reusable pipeline stages with atomic configuration and moves.
CREATE TABLE public.employer_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  position INTEGER NOT NULL CHECK (position >= 0),
  application_status TEXT NOT NULL CHECK (
    application_status IN ('reviewing', 'interview', 'offer', 'rejected')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recruiter_id, name),
  UNIQUE (recruiter_id, position)
);

CREATE INDEX idx_employer_pipeline_stages_order
  ON public.employer_pipeline_stages (recruiter_id, position);

ALTER TABLE public.employer_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers manage their pipeline stages"
ON public.employer_pipeline_stages FOR ALL TO authenticated
USING (recruiter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (recruiter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.applications
  ADD COLUMN pipeline_stage_id UUID
  REFERENCES public.employer_pipeline_stages(id) ON DELETE SET NULL;

ALTER TABLE public.application_status_events
  ADD COLUMN stage_name TEXT CHECK (char_length(stage_name) <= 60);

CREATE OR REPLACE FUNCTION public.protect_application_pipeline_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pipeline_stage_id IS NOT DISTINCT FROM OLD.pipeline_stage_id THEN
    RETURN NEW;
  END IF;

  IF public.is_service_role() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF current_setting('hiregeneral.pipeline_move', true) <> 'allowed' THEN
    RAISE EXCEPTION 'Pipeline stages must be changed through the employer workflow'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_application_pipeline_stage
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.protect_application_pipeline_stage();

INSERT INTO public.employer_pipeline_stages (
  recruiter_id, name, position, application_status
)
SELECT recruiter_id, stage.name, stage.position, stage.application_status
FROM (SELECT DISTINCT recruiter_id FROM public.jobs) AS recruiter
CROSS JOIN (
  VALUES
    ('Reviewing', 0, 'reviewing'),
    ('Interview', 1, 'interview'),
    ('Offer', 2, 'offer'),
    ('Not selected', 3, 'rejected')
) AS stage(name, position, application_status)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_default_employer_pipeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.employer_pipeline_stages
    WHERE recruiter_id = NEW.recruiter_id
  ) THEN
    INSERT INTO public.employer_pipeline_stages (
      recruiter_id, name, position, application_status
    ) VALUES
      (NEW.recruiter_id, 'Reviewing', 0, 'reviewing'),
      (NEW.recruiter_id, 'Interview', 1, 'interview'),
      (NEW.recruiter_id, 'Offer', 2, 'offer'),
      (NEW.recruiter_id, 'Not selected', 3, 'rejected')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_default_employer_pipeline
AFTER INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.ensure_default_employer_pipeline();

CREATE OR REPLACE FUNCTION public.employer_replace_pipeline_stages(
  p_stages JSONB
)
RETURNS SETOF public.employer_pipeline_stages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
  stage JSONB;
  stage_id UUID;
  keep_ids UUID[] := ARRAY[]::UUID[];
  stage_count INTEGER;
BEGIN
  IF actor IS NULL OR NOT (
    public.has_role(actor, 'recruiter') OR public.has_role(actor, 'admin')
  ) THEN
    RAISE EXCEPTION 'Employer access required' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_stages) <> 'array' THEN
    RAISE EXCEPTION 'Pipeline stages must be an array' USING ERRCODE = '22023';
  END IF;

  stage_count := jsonb_array_length(p_stages);
  IF stage_count < 2 OR stage_count > 12 THEN
    RAISE EXCEPTION 'A pipeline must contain between 2 and 12 stages'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(actor::TEXT, 4));

  UPDATE public.employer_pipeline_stages
  SET
    position = position + 1000,
    name = '__pipeline_tmp__' || id::TEXT
  WHERE recruiter_id = actor;

  FOR stage IN SELECT value FROM jsonb_array_elements(p_stages)
  LOOP
    IF COALESCE(btrim(stage->>'name'), '') = ''
      OR char_length(btrim(stage->>'name')) > 60
      OR (stage->>'position') !~ '^\d+$'
      OR (stage->>'applicationStatus') NOT IN (
        'reviewing', 'interview', 'offer', 'rejected'
      ) THEN
      RAISE EXCEPTION 'Invalid pipeline stage' USING ERRCODE = '22023';
    END IF;

    stage_id := COALESCE(NULLIF(stage->>'id', '')::UUID, gen_random_uuid());

    IF EXISTS (
      SELECT 1 FROM public.employer_pipeline_stages
      WHERE id = stage_id AND recruiter_id <> actor
    ) THEN
      RAISE EXCEPTION 'Pipeline stage not found' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.employer_pipeline_stages (
      id, recruiter_id, name, position, application_status
    ) VALUES (
      stage_id,
      actor,
      btrim(stage->>'name'),
      (stage->>'position')::INTEGER,
      stage->>'applicationStatus'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      position = EXCLUDED.position,
      application_status = EXCLUDED.application_status,
      updated_at = now()
    WHERE employer_pipeline_stages.recruiter_id = actor;

    keep_ids := array_append(keep_ids, stage_id);
  END LOOP;

  DELETE FROM public.employer_pipeline_stages
  WHERE recruiter_id = actor AND NOT (id = ANY(keep_ids));

  RETURN QUERY
  SELECT * FROM public.employer_pipeline_stages
  WHERE recruiter_id = actor
  ORDER BY position;
END;
$$;

CREATE OR REPLACE FUNCTION public.employer_move_application_to_stage(
  p_application_id UUID,
  p_stage_id UUID,
  p_note TEXT DEFAULT NULL
)
RETURNS public.applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
  target_stage public.employer_pipeline_stages;
  current_application public.applications;
  normalized_note TEXT := NULLIF(btrim(p_note), '');
BEGIN
  SELECT * INTO target_stage
  FROM public.employer_pipeline_stages
  WHERE id = p_stage_id AND recruiter_id = actor;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pipeline stage not found' USING ERRCODE = '42501';
  END IF;

  IF normalized_note IS NOT NULL AND char_length(normalized_note) > 1000 THEN
    RAISE EXCEPTION 'Response note is too long' USING ERRCODE = '22023';
  END IF;

  SELECT application.* INTO current_application
  FROM public.applications AS application
  JOIN public.jobs AS job ON job.id = application.job_id
  WHERE application.id = p_application_id
    AND job.recruiter_id = actor
  FOR UPDATE OF application;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found' USING ERRCODE = '42501';
  END IF;

  IF current_application.status IN ('rejected', 'withdrawn') THEN
    RAISE EXCEPTION 'Closed applications cannot be moved' USING ERRCODE = '22023';
  END IF;

  PERFORM set_config('hiregeneral.pipeline_move', 'allowed', true);

  UPDATE public.applications
  SET
    pipeline_stage_id = target_stage.id,
    status = target_stage.application_status
  WHERE id = p_application_id
  RETURNING * INTO current_application;

  INSERT INTO public.application_status_events (
    application_id,
    status,
    stage_name,
    note,
    visible_to_applicant,
    created_by
  ) VALUES (
    p_application_id,
    target_stage.application_status,
    target_stage.name,
    normalized_note,
    true,
    actor
  );

  RETURN current_application;
END;
$$;

REVOKE ALL ON FUNCTION public.employer_replace_pipeline_stages(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.employer_move_application_to_stage(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.employer_replace_pipeline_stages(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.employer_move_application_to_stage(UUID, UUID, TEXT) TO authenticated;
