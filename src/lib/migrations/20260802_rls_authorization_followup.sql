-- Close the remaining authorization gaps found after the initial RLS
-- hardening deployment. Billing-backed records remain writable only through
-- trusted service-role workflows.

DROP POLICY IF EXISTS "Employers can manage their job boosts"
ON public.job_boosts;

DROP POLICY IF EXISTS "Users can save jobs" ON public.saved_jobs;
CREATE POLICY "Job seekers can save published jobs"
ON public.saved_jobs FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'job_seeker')
  AND EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = saved_jobs.job_id
      AND jobs.status = 'published'
      AND (jobs.expires_at IS NULL OR jobs.expires_at > now())
  )
);

DROP POLICY IF EXISTS "Recruiters can create own candidate invites"
ON public.employer_candidate_invites;
CREATE POLICY "Recruiters can invite eligible candidates"
ON public.employer_candidate_invites FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = recruiter_id
  AND public.has_role(auth.uid(), 'recruiter')
  AND status = 'sent'
  AND EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = employer_candidate_invites.job_id
      AND jobs.recruiter_id = auth.uid()
      AND jobs.status = 'published'
      AND (jobs.expires_at IS NULL OR jobs.expires_at > now())
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = employer_candidate_invites.candidate_id
      AND profiles.user_type = 'job_seeker'
      AND profiles.visibility = 'public'
      AND profiles.deleted_at IS NULL
  )
);

CREATE OR REPLACE FUNCTION public.protect_candidate_invite_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.recruiter_id IS DISTINCT FROM OLD.recruiter_id
    OR NEW.candidate_id IS DISTINCT FROM OLD.candidate_id
    OR NEW.job_id IS DISTINCT FROM OLD.job_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Candidate invite ownership fields cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_candidate_invite_identity
ON public.employer_candidate_invites;
CREATE TRIGGER protect_candidate_invite_identity
BEFORE UPDATE ON public.employer_candidate_invites
FOR EACH ROW EXECUTE FUNCTION public.protect_candidate_invite_identity();

REVOKE ALL ON FUNCTION public.protect_candidate_invite_identity() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.protect_message_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
    OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
    OR NEW.body IS DISTINCT FROM OLD.body
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Sent message content and ownership fields cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_message_identity() FROM PUBLIC;
