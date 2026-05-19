-- Employer workflow: job screening questions and invite-to-apply tracking.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS screening_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.employer_candidate_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recruiter_id, candidate_id, job_id)
);

ALTER TABLE public.employer_candidate_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can view own candidate invites"
ON public.employer_candidate_invites;

CREATE POLICY "Recruiters can view own candidate invites"
ON public.employer_candidate_invites FOR SELECT TO authenticated
USING (auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Recruiters can create own candidate invites"
ON public.employer_candidate_invites;

CREATE POLICY "Recruiters can create own candidate invites"
ON public.employer_candidate_invites FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = recruiter_id
  AND (
    public.has_role(auth.uid(), 'recruiter')
    OR public.has_role(auth.uid(), 'admin')
  )
  AND EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = employer_candidate_invites.job_id
      AND jobs.recruiter_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Recruiters can update own candidate invites"
ON public.employer_candidate_invites;

CREATE POLICY "Recruiters can update own candidate invites"
ON public.employer_candidate_invites FOR UPDATE TO authenticated
USING (auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (
  auth.uid() = recruiter_id
  AND (
    public.has_role(auth.uid(), 'recruiter')
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE INDEX IF NOT EXISTS idx_employer_candidate_invites_recruiter_created
  ON public.employer_candidate_invites (recruiter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employer_candidate_invites_job
  ON public.employer_candidate_invites (job_id);

CREATE INDEX IF NOT EXISTS idx_employer_candidate_invites_candidate
  ON public.employer_candidate_invites (candidate_id);
