-- Company-scoped collaboration and private structured interview feedback.
CREATE TABLE public.employer_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'interviewer')),
  invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX idx_employer_team_members_user
  ON public.employer_team_members (user_id, company_id);

INSERT INTO public.employer_team_members (company_id, user_id, role, invited_by)
SELECT id, owner_id, 'owner', owner_id
FROM public.companies
ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'owner';

CREATE OR REPLACE FUNCTION public.ensure_company_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.employer_team_members (company_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id)
  ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'owner';
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_company_owner_membership
AFTER INSERT OR UPDATE OF owner_id ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.ensure_company_owner_membership();

CREATE OR REPLACE FUNCTION public.is_company_team_member(
  p_company_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.employer_team_members
    WHERE company_id = p_company_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_company_team(
  p_company_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.employer_team_members
    WHERE company_id = p_company_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_employer_application(
  p_application_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications AS application
    JOIN public.jobs AS job ON job.id = application.job_id
    WHERE application.id = p_application_id
      AND public.is_company_team_member(job.company_id, p_user_id)
  );
$$;

ALTER TABLE public.employer_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company teammates can view their team"
ON public.employer_team_members FOR SELECT TO authenticated
USING (public.is_company_team_member(company_id));

CREATE POLICY "Company managers can add teammates"
ON public.employer_team_members FOR INSERT TO authenticated
WITH CHECK (
  public.can_manage_company_team(company_id)
  AND role IN ('admin', 'interviewer')
  AND public.has_role(user_id, 'recruiter')
);

CREATE POLICY "Company managers can update teammates"
ON public.employer_team_members FOR UPDATE TO authenticated
USING (public.can_manage_company_team(company_id) AND role <> 'owner')
WITH CHECK (
  public.can_manage_company_team(company_id)
  AND role IN ('admin', 'interviewer')
  AND public.has_role(user_id, 'recruiter')
);

CREATE POLICY "Company managers can remove teammates"
ON public.employer_team_members FOR DELETE TO authenticated
USING (public.can_manage_company_team(company_id) AND role <> 'owner');

DROP POLICY IF EXISTS "Applicants and recruiters can view applications"
  ON public.applications;
CREATE POLICY "Applicants and company team can view applications"
ON public.applications FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.can_access_employer_application(id)
);

CREATE OR REPLACE FUNCTION public.valid_scorecard_criteria(p_criteria JSONB)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT jsonb_typeof(p_criteria) = 'array'
    AND jsonb_array_length(p_criteria) BETWEEN 1 AND 12
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_criteria) AS criterion
      WHERE jsonb_typeof(criterion) <> 'object'
        OR COALESCE(btrim(criterion->>'name'), '') = ''
        OR char_length(btrim(criterion->>'name')) > 80
        OR (criterion->>'rating') !~ '^[1-5]$'
        OR char_length(COALESCE(criterion->>'note', '')) > 1000
    );
$$;

CREATE TABLE public.interview_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  interview_round TEXT NOT NULL CHECK (
    char_length(btrim(interview_round)) BETWEEN 1 AND 80
  ),
  recommendation TEXT NOT NULL CHECK (
    recommendation IN ('strong_yes', 'yes', 'mixed', 'no', 'strong_no')
  ),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  criteria JSONB NOT NULL CHECK (public.valid_scorecard_criteria(criteria)),
  summary TEXT CHECK (char_length(summary) <= 3000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, reviewer_id, interview_round)
);

CREATE INDEX idx_interview_scorecards_application
  ON public.interview_scorecards (application_id, submitted_at DESC);

ALTER TABLE public.interview_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company teammates can view interview scorecards"
ON public.interview_scorecards FOR SELECT TO authenticated
USING (public.can_access_employer_application(application_id));

CREATE POLICY "Company teammates create their scorecards"
ON public.interview_scorecards FOR INSERT TO authenticated
WITH CHECK (
  reviewer_id = auth.uid()
  AND public.can_access_employer_application(application_id)
);

CREATE POLICY "Reviewers update their scorecards"
ON public.interview_scorecards FOR UPDATE TO authenticated
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Reviewers delete their scorecards"
ON public.interview_scorecards FOR DELETE TO authenticated
USING (reviewer_id = auth.uid());

GRANT EXECUTE ON FUNCTION public.is_company_team_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_company_team(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_employer_application(UUID, UUID) TO authenticated;
