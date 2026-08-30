-- Atomic, auditable application status changes shared by applicants and employers.
CREATE TABLE IF NOT EXISTS public.application_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn')),
  note TEXT,
  visible_to_applicant BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT application_status_events_note_length CHECK (char_length(note) <= 1000),
  CONSTRAINT application_status_events_backfill_key UNIQUE (application_id, status, created_at)
);

CREATE INDEX IF NOT EXISTS idx_application_status_events_timeline
  ON public.application_status_events (application_id, created_at ASC);

ALTER TABLE public.application_status_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Application participants can view status events"
  ON public.application_status_events;
CREATE POLICY "Application participants can view status events"
ON public.application_status_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications AS application
    JOIN public.jobs AS job ON job.id = application.job_id
    WHERE application.id = application_status_events.application_id
      AND (
        (application.user_id = auth.uid() AND application_status_events.visible_to_applicant)
        OR job.recruiter_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

REVOKE INSERT, UPDATE, DELETE ON public.application_status_events FROM authenticated;

CREATE OR REPLACE FUNCTION public.record_initial_application_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.application_status_events (
    application_id, status, note, visible_to_applicant, created_by, created_at
  ) VALUES (
    NEW.id, NEW.status, NULL, true, NEW.user_id, NEW.created_at
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_initial_application_status ON public.applications;
CREATE TRIGGER record_initial_application_status
AFTER INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.record_initial_application_status();

INSERT INTO public.application_status_events (
  application_id, status, note, visible_to_applicant, created_by, created_at
)
SELECT id, status, NULL, true, user_id, created_at
FROM public.applications
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.employer_update_application_status(
  p_application_id UUID,
  p_status TEXT,
  p_note TEXT DEFAULT NULL
)
RETURNS public.applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
  current_application public.applications;
  normalized_note TEXT := NULLIF(btrim(p_note), '');
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('reviewing', 'interview', 'offer', 'rejected') THEN
    RAISE EXCEPTION 'Invalid employer application status' USING ERRCODE = '22023';
  END IF;

  IF normalized_note IS NOT NULL AND char_length(normalized_note) > 1000 THEN
    RAISE EXCEPTION 'Response note is too long' USING ERRCODE = '22023';
  END IF;

  SELECT application.* INTO current_application
  FROM public.applications AS application
  JOIN public.jobs AS job ON job.id = application.job_id
  WHERE application.id = p_application_id
    AND (job.recruiter_id = actor OR public.has_role(actor, 'admin'))
  FOR UPDATE OF application;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found' USING ERRCODE = '42501';
  END IF;

  IF current_application.status IN ('rejected', 'withdrawn') THEN
    RAISE EXCEPTION 'Closed applications cannot be advanced' USING ERRCODE = '22023';
  END IF;

  IF current_application.status = p_status AND normalized_note IS NULL THEN
    RETURN current_application;
  END IF;

  UPDATE public.applications
  SET status = p_status
  WHERE id = p_application_id
  RETURNING * INTO current_application;

  INSERT INTO public.application_status_events (
    application_id, status, note, visible_to_applicant, created_by
  ) VALUES (
    p_application_id, p_status, normalized_note, true, actor
  );

  RETURN current_application;
END;
$$;

REVOKE ALL ON FUNCTION public.employer_update_application_status(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.employer_update_application_status(UUID, TEXT, TEXT) TO authenticated;
