-- Server-authoritative employer entitlements. API checks provide friendly
-- errors; these database boundaries prevent direct and concurrent bypasses.

CREATE OR REPLACE FUNCTION public.current_employer_entitlements()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company public.companies%ROWTYPE;
  effective_plan TEXT;
  paid_active BOOLEAN;
  invitation_limit INTEGER;
  message_limit INTEGER;
  active_jobs INTEGER;
  invitations_used INTEGER;
  messages_used INTEGER;
BEGIN
  SELECT * INTO company
  FROM public.companies
  WHERE owner_id = auth.uid()
  ORDER BY updated_at DESC
  LIMIT 1;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object(
      'companyId', company.id,
      'plan', 'pro',
      'active', TRUE,
      'activeJobLimit', 2147483647,
      'activeJobs', 0,
      'candidateDatabase', TRUE,
      'invitationLimit', 2147483647,
      'invitationsUsed', 0,
      'messageLimit', 2147483647,
      'messagesUsed', 0,
      'premiumAnalytics', TRUE,
      'boostCredits', 2147483647
    );
  END IF;

  IF company.id IS NULL THEN
    RETURN jsonb_build_object(
      'companyId', NULL,
      'plan', 'starter',
      'active', FALSE,
      'activeJobLimit', 0,
      'activeJobs', 0,
      'candidateDatabase', FALSE,
      'invitationLimit', 0,
      'invitationsUsed', 0,
      'messageLimit', 0,
      'messagesUsed', 0,
      'premiumAnalytics', FALSE,
      'boostCredits', 0
    );
  END IF;

  paid_active := company.billing_plan IN ('growth', 'pro')
    AND company.subscription_status IN ('active', 'trialing');
  effective_plan := CASE WHEN paid_active THEN company.billing_plan ELSE 'starter' END;
  invitation_limit := CASE effective_plan
    WHEN 'growth' THEN 100
    WHEN 'pro' THEN 1000
    ELSE 0
  END;
  message_limit := CASE effective_plan
    WHEN 'growth' THEN 500
    WHEN 'pro' THEN 5000
    ELSE 50
  END;

  SELECT count(*) INTO active_jobs
  FROM public.jobs
  WHERE recruiter_id = auth.uid() AND status = 'published';

  SELECT count(*) INTO invitations_used
  FROM public.employer_candidate_invites
  WHERE recruiter_id = auth.uid()
    AND created_at >= date_trunc('month', now());

  SELECT count(*) INTO messages_used
  FROM public.messages
  WHERE sender_id = auth.uid()
    AND created_at >= date_trunc('month', now());

  RETURN jsonb_build_object(
    'companyId', company.id,
    'plan', effective_plan,
    'active', paid_active,
    'activeJobLimit', company.active_job_limit,
    'activeJobs', active_jobs,
    'candidateDatabase', paid_active,
    'invitationLimit', invitation_limit,
    'invitationsUsed', invitations_used,
    'messageLimit', message_limit,
    'messagesUsed', messages_used,
    'premiumAnalytics', effective_plan = 'pro',
    'boostCredits', company.boost_credits
  );
END;
$$;

REVOKE ALL ON FUNCTION public.current_employer_entitlements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_employer_entitlements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_employer_entitlements() TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_job_entitlements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company public.companies%ROWTYPE;
  current_active_jobs INTEGER;
  needs_publish_slot BOOLEAN;
  needs_boost_credit BOOLEAN;
BEGIN
  IF public.is_service_role() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.source_id IS NOT NULL THEN RETURN NEW; END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.recruiter_id::TEXT, 0));

  SELECT * INTO company
  FROM public.companies
  WHERE id = NEW.company_id AND owner_id = NEW.recruiter_id
  FOR UPDATE;

  IF company.id IS NULL THEN
    RAISE EXCEPTION 'Job company is not owned by recruiter' USING ERRCODE = '42501';
  END IF;

  needs_publish_slot := NEW.status = 'published'
    AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published');

  IF needs_publish_slot THEN
    SELECT count(*) INTO current_active_jobs
    FROM public.jobs
    WHERE recruiter_id = NEW.recruiter_id
      AND status = 'published'
      AND (TG_OP = 'INSERT' OR id <> OLD.id);

    IF current_active_jobs >= company.active_job_limit THEN
      RAISE EXCEPTION 'Active job limit reached' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  needs_boost_credit := COALESCE(NEW.boost_id, 'none') <> 'none'
    AND (
      TG_OP = 'INSERT'
      OR COALESCE(OLD.boost_id, 'none') = 'none'
      OR OLD.boost_id IS DISTINCT FROM NEW.boost_id
    );

  IF needs_boost_credit THEN
    UPDATE public.companies
    SET boost_credits = boost_credits - 1
    WHERE id = company.id AND boost_credits > 0;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Boost credit required' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_job_entitlements ON public.jobs;
CREATE TRIGGER enforce_job_entitlements
BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.enforce_job_entitlements();

CREATE OR REPLACE FUNCTION public.enforce_invitation_entitlements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company public.companies%ROWTYPE;
  monthly_limit INTEGER;
  monthly_used INTEGER;
BEGIN
  IF public.is_service_role() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.recruiter_id::TEXT, 1));
  SELECT * INTO company
  FROM public.companies
  WHERE owner_id = NEW.recruiter_id
  ORDER BY updated_at DESC
  LIMIT 1
  FOR UPDATE;

  IF company.billing_plan NOT IN ('growth', 'pro')
    OR company.subscription_status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Candidate invitations require an active paid plan'
      USING ERRCODE = 'P0001';
  END IF;

  monthly_limit := CASE company.billing_plan WHEN 'pro' THEN 1000 ELSE 100 END;
  SELECT count(*) INTO monthly_used
  FROM public.employer_candidate_invites
  WHERE recruiter_id = NEW.recruiter_id
    AND created_at >= date_trunc('month', now())
    AND (TG_OP = 'INSERT' OR id <> OLD.id);

  IF monthly_used >= monthly_limit THEN
    RAISE EXCEPTION 'Monthly invitation limit reached' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_invitation_entitlements
ON public.employer_candidate_invites;
CREATE TRIGGER enforce_invitation_entitlements
BEFORE INSERT ON public.employer_candidate_invites
FOR EACH ROW EXECUTE FUNCTION public.enforce_invitation_entitlements();

CREATE OR REPLACE FUNCTION public.enforce_employer_message_entitlements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company public.companies%ROWTYPE;
  monthly_limit INTEGER;
  monthly_used INTEGER;
BEGIN
  IF public.is_service_role() OR public.has_role(auth.uid(), 'admin')
    OR NOT public.has_role(NEW.sender_id, 'recruiter') THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.sender_id::TEXT, 2));
  SELECT * INTO company
  FROM public.companies
  WHERE owner_id = NEW.sender_id
  ORDER BY updated_at DESC
  LIMIT 1;

  monthly_limit := CASE
    WHEN company.billing_plan = 'pro'
      AND company.subscription_status IN ('active', 'trialing') THEN 5000
    WHEN company.billing_plan = 'growth'
      AND company.subscription_status IN ('active', 'trialing') THEN 500
    ELSE 50
  END;

  SELECT count(*) INTO monthly_used
  FROM public.messages
  WHERE sender_id = NEW.sender_id
    AND created_at >= date_trunc('month', now());

  IF monthly_used >= monthly_limit THEN
    RAISE EXCEPTION 'Monthly employer messaging limit reached'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_employer_message_entitlements ON public.messages;
CREATE TRIGGER enforce_employer_message_entitlements
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_employer_message_entitlements();

-- Public candidate sourcing is paid. All recruiters retain access to profiles
-- belonging to applicants for jobs they own.
DROP POLICY IF EXISTS "Owners admins and recruiters can view profiles"
ON public.profiles;
CREATE POLICY "Owners admins and entitled recruiters can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.applications
    JOIN public.jobs ON jobs.id = applications.job_id
    WHERE applications.user_id = profiles.user_id
      AND jobs.recruiter_id = auth.uid()
  )
  OR (
    visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.owner_id = auth.uid()
        AND companies.billing_plan IN ('growth', 'pro')
        AND companies.subscription_status IN ('active', 'trialing')
    )
  )
);

REVOKE ALL ON FUNCTION public.enforce_job_entitlements() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_invitation_entitlements() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_employer_message_entitlements() FROM PUBLIC;
