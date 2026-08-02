-- Tighten the database boundary for user-controlled writes. Service-role
-- operations continue to bypass RLS for ingestion, billing webhooks, and
-- other trusted server workflows.

CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role public.app_role
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
$$;

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role)
TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(auth.role(), '') = 'service_role'
$$;

REVOKE ALL ON FUNCTION public.is_service_role() FROM PUBLIC;

DROP POLICY IF EXISTS "Public profiles are viewable, owners and admins can view private"
ON public.profiles;
CREATE POLICY "Owners admins and recruiters can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR (
    visibility = 'public'
    AND public.has_role(auth.uid(), 'recruiter')
  )
);

DROP POLICY IF EXISTS "Companies are publicly viewable" ON public.companies;
CREATE POLICY "Owners and admins can view companies"
ON public.companies FOR SELECT TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND user_type IN ('job_seeker', 'recruiter')
  AND public.has_role(auth.uid(), user_type)
);

DROP POLICY IF EXISTS "Recruiters can create companies" ON public.companies;
CREATE POLICY "Recruiters can create companies"
ON public.companies FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    auth.uid() = owner_id
    AND public.has_role(auth.uid(), 'recruiter')
    AND stripe_customer_id IS NULL
    AND stripe_subscription_id IS NULL
    AND billing_plan = 'starter'
    AND subscription_status = 'inactive'
    AND current_period_end IS NULL
    AND active_job_limit = 3
    AND account_credit_cents = 0
    AND boost_credits = 0
  )
);

CREATE OR REPLACE FUNCTION public.protect_profile_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.user_type IS DISTINCT FROM OLD.user_type THEN
    RAISE EXCEPTION 'Profile identity and role cannot be changed directly'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_identity ON public.profiles;
CREATE TRIGGER protect_profile_identity
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_identity();

CREATE OR REPLACE FUNCTION public.protect_company_authorization_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id
    OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
    OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
    OR NEW.billing_plan IS DISTINCT FROM OLD.billing_plan
    OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
    OR NEW.current_period_end IS DISTINCT FROM OLD.current_period_end
    OR NEW.active_job_limit IS DISTINCT FROM OLD.active_job_limit
    OR NEW.account_credit_cents IS DISTINCT FROM OLD.account_credit_cents
    OR NEW.boost_credits IS DISTINCT FROM OLD.boost_credits THEN
    RAISE EXCEPTION 'Company ownership and billing fields require a privileged operation'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_company_authorization_fields ON public.companies;
CREATE TRIGGER protect_company_authorization_fields
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.protect_company_authorization_fields();

DROP POLICY IF EXISTS "Recruiters can create jobs" ON public.jobs;
CREATE POLICY "Recruiters can create jobs"
ON public.jobs FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = recruiter_id
  AND (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin'))
  AND (
    company_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = jobs.company_id
        AND (companies.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
);

DROP POLICY IF EXISTS "Recruiters can manage their jobs" ON public.jobs;
CREATE POLICY "Recruiters can manage their jobs"
ON public.jobs FOR UPDATE TO authenticated
USING (auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (
  (auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'))
  AND (
    company_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = jobs.company_id
        AND (companies.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
);

DROP POLICY IF EXISTS "Users can submit applications" ON public.applications;
CREATE POLICY "Job seekers can submit applications"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'submitted'
  AND public.has_role(auth.uid(), 'job_seeker')
  AND EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = applications.job_id
      AND jobs.status = 'published'
      AND (jobs.expires_at IS NULL OR jobs.expires_at > now())
  )
);

CREATE OR REPLACE FUNCTION public.protect_application_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
  owns_job BOOLEAN;
BEGIN
  IF public.is_service_role() OR public.has_role(actor, 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.job_id IS DISTINCT FROM OLD.job_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Application ownership fields cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF actor = OLD.user_id THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Applicants cannot change employer-managed status'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = OLD.job_id AND jobs.recruiter_id = actor
  ) INTO owns_job;

  IF owns_job THEN
    IF NEW.resume_url IS DISTINCT FROM OLD.resume_url
      OR NEW.cover_note IS DISTINCT FROM OLD.cover_note
      OR NEW.applicant_full_name IS DISTINCT FROM OLD.applicant_full_name
      OR NEW.applicant_email IS DISTINCT FROM OLD.applicant_email
      OR NEW.applicant_phone IS DISTINCT FROM OLD.applicant_phone
      OR NEW.applicant_location IS DISTINCT FROM OLD.applicant_location
      OR NEW.applicant_linkedin IS DISTINCT FROM OLD.applicant_linkedin
      OR NEW.applicant_portfolio IS DISTINCT FROM OLD.applicant_portfolio
      OR NEW.years_experience IS DISTINCT FROM OLD.years_experience
      OR NEW.work_authorization IS DISTINCT FROM OLD.work_authorization
      OR NEW.requires_sponsorship IS DISTINCT FROM OLD.requires_sponsorship THEN
      RAISE EXCEPTION 'Recruiters can only change employer-managed application fields'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not authorized to update this application'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS protect_application_update ON public.applications;
CREATE TRIGGER protect_application_update
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.protect_application_update();

CREATE OR REPLACE FUNCTION public.protect_conversation_identity()
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
    OR NEW.participant_one IS DISTINCT FROM OLD.participant_one
    OR NEW.participant_two IS DISTINCT FROM OLD.participant_two
    OR NEW.job_id IS DISTINCT FROM OLD.job_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Conversation participants cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_conversation_identity ON public.conversations;
CREATE TRIGGER protect_conversation_identity
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.protect_conversation_identity();

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
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Message ownership fields cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_message_identity ON public.messages;
CREATE TRIGGER protect_message_identity
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.protect_message_identity();

CREATE OR REPLACE FUNCTION public.protect_notification_identity()
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
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.type IS DISTINCT FROM OLD.type
    OR NEW.title IS DISTINCT FROM OLD.title
    OR NEW.body IS DISTINCT FROM OLD.body
    OR NEW.link IS DISTINCT FROM OLD.link
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only notification read state can be changed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_notification_identity ON public.notifications;
CREATE TRIGGER protect_notification_identity
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.protect_notification_identity();

REVOKE ALL ON FUNCTION public.protect_profile_identity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_company_authorization_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_application_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_conversation_identity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_message_identity() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_notification_identity() FROM PUBLIC;
