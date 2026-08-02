-- Make Stripe webhook processing concurrency-safe and add durable security
-- audit coverage for the remaining Phase 2 mutation categories.

ALTER TABLE public.billing_events
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS claim_token UUID,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE public.billing_events
  ALTER COLUMN processed_at DROP NOT NULL,
  ALTER COLUMN processed_at DROP DEFAULT;

UPDATE public.billing_events
SET status = 'completed',
    processed_at = COALESCE(processed_at, now())
WHERE status IS NULL;

ALTER TABLE public.billing_events
  ALTER COLUMN status SET DEFAULT 'processing',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.billing_events
  DROP CONSTRAINT IF EXISTS billing_events_status_check;
ALTER TABLE public.billing_events
  ADD CONSTRAINT billing_events_status_check
  CHECK (status IN ('processing', 'completed', 'failed'));

CREATE OR REPLACE FUNCTION public.claim_billing_event(
  p_stripe_event_id TEXT,
  p_event_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_claim_token UUID := gen_random_uuid();
  claimed_token UUID;
BEGIN
  INSERT INTO public.billing_events (
    stripe_event_id,
    event_type,
    status,
    attempts,
    last_attempt_at,
    claim_token,
    processed_at,
    last_error
  )
  VALUES (
    p_stripe_event_id,
    p_event_type,
    'processing',
    1,
    now(),
    new_claim_token,
    NULL,
    NULL
  )
  ON CONFLICT (stripe_event_id) DO UPDATE
  SET event_type = EXCLUDED.event_type,
      status = 'processing',
      attempts = public.billing_events.attempts + 1,
      last_attempt_at = now(),
      claim_token = new_claim_token,
      processed_at = NULL,
      last_error = NULL
  WHERE public.billing_events.status = 'failed'
     OR (
       public.billing_events.status = 'processing'
       AND public.billing_events.last_attempt_at < now() - interval '10 minutes'
     )
  RETURNING claim_token INTO claimed_token;

  RETURN claimed_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_billing_event(
  p_stripe_event_id TEXT,
  p_claim_token UUID,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_id UUID;
BEGIN
  IF p_status NOT IN ('completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid billing event completion status'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.billing_events
  SET status = p_status,
      processed_at = CASE WHEN p_status = 'completed' THEN now() ELSE NULL END,
      last_error = CASE WHEN p_status = 'failed' THEN 'processing_failed' ELSE NULL END
  WHERE stripe_event_id = p_stripe_event_id
    AND claim_token = p_claim_token
    AND status = 'processing'
  RETURNING id INTO updated_id;

  RETURN updated_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_billing_event(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finish_billing_event(TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_billing_event(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_billing_event(TEXT, UUID, TEXT)
TO service_role;

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_role TEXT NOT NULL DEFAULT 'unknown',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_audit_log_created_idx
ON public.security_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS security_audit_log_target_idx
ON public.security_audit_log (target_type, target_id, created_at DESC);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view security audit log"
ON public.security_audit_log;
CREATE POLICY "Admins can view security audit log"
ON public.security_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.append_security_audit(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.security_audit_log (
    actor_id,
    actor_role,
    action,
    target_type,
    target_id,
    metadata
  )
  VALUES (
    auth.uid(),
    COALESCE(auth.role(), 'unknown'),
    p_action,
    p_target_type,
    p_target_id,
    COALESCE(p_metadata, '{}'::jsonb)
  )
$$;

REVOKE ALL ON FUNCTION public.append_security_audit(TEXT, TEXT, TEXT, JSONB)
FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_security_audit(TEXT, TEXT, TEXT, JSONB)
TO service_role;

CREATE OR REPLACE FUNCTION public.audit_job_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_action TEXT;
BEGIN
  -- Imported jobs are operational ingestion records rather than employer
  -- security events and would overwhelm the audit stream.
  IF NEW.source_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    audit_action := CASE
      WHEN NEW.status = 'published' THEN 'job.created_and_published'
      ELSE 'job.created'
    END;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    audit_action := CASE
      WHEN NEW.status = 'published' THEN 'job.published'
      WHEN NEW.status = 'closed' THEN 'job.closed'
      ELSE 'job.status_changed'
    END;
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.append_security_audit(
    audit_action,
    'job',
    NEW.id::TEXT,
    jsonb_build_object(
      'company_id', NEW.company_id,
      'recruiter_id', NEW.recruiter_id,
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      'new_status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_job_lifecycle ON public.jobs;
CREATE TRIGGER audit_job_lifecycle
AFTER INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.audit_job_lifecycle();

CREATE OR REPLACE FUNCTION public.audit_employer_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND NEW.status IS NOT DISTINCT FROM OLD.status
    AND NEW.message IS NOT DISTINCT FROM OLD.message THEN
    RETURN NEW;
  END IF;

  PERFORM public.append_security_audit(
    CASE WHEN TG_OP = 'INSERT'
      THEN 'employer_invitation.created'
      ELSE 'employer_invitation.updated'
    END,
    'employer_candidate_invite',
    NEW.id::TEXT,
    jsonb_build_object(
      'recruiter_id', NEW.recruiter_id,
      'candidate_id', NEW.candidate_id,
      'job_id', NEW.job_id,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_employer_invitation
ON public.employer_candidate_invites;
CREATE TRIGGER audit_employer_invitation
AFTER INSERT OR UPDATE ON public.employer_candidate_invites
FOR EACH ROW EXECUTE FUNCTION public.audit_employer_invitation();

CREATE OR REPLACE FUNCTION public.audit_company_billing_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.billing_plan IS NOT DISTINCT FROM OLD.billing_plan
    AND NEW.subscription_status IS NOT DISTINCT FROM OLD.subscription_status
    AND NEW.current_period_end IS NOT DISTINCT FROM OLD.current_period_end
    AND NEW.active_job_limit IS NOT DISTINCT FROM OLD.active_job_limit
    AND NEW.account_credit_cents IS NOT DISTINCT FROM OLD.account_credit_cents
    AND NEW.boost_credits IS NOT DISTINCT FROM OLD.boost_credits
    AND NEW.stripe_customer_id IS NOT DISTINCT FROM OLD.stripe_customer_id
    AND NEW.stripe_subscription_id IS NOT DISTINCT FROM OLD.stripe_subscription_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.append_security_audit(
    'billing.company_changed',
    'company',
    NEW.id::TEXT,
    jsonb_build_object(
      'old_plan', OLD.billing_plan,
      'new_plan', NEW.billing_plan,
      'old_status', OLD.subscription_status,
      'new_status', NEW.subscription_status,
      'old_active_job_limit', OLD.active_job_limit,
      'new_active_job_limit', NEW.active_job_limit,
      'old_account_credit_cents', OLD.account_credit_cents,
      'new_account_credit_cents', NEW.account_credit_cents,
      'old_boost_credits', OLD.boost_credits,
      'new_boost_credits', NEW.boost_credits
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_company_billing_change ON public.companies;
CREATE TRIGGER audit_company_billing_change
AFTER UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.audit_company_billing_change();

CREATE OR REPLACE FUNCTION public.audit_billing_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_data JSONB;
  record_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    row_data := to_jsonb(OLD);
  ELSE
    row_data := to_jsonb(NEW);
  END IF;
  record_id := row_data ->> 'id';

  PERFORM public.append_security_audit(
    'billing.' || TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    record_id,
    jsonb_strip_nulls(jsonb_build_object(
      'company_id', row_data ->> 'company_id',
      'job_id', row_data ->> 'job_id',
      'amount_paid_cents', row_data ->> 'amount_paid_cents',
      'currency', row_data ->> 'currency'
    ))
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS audit_billing_receipt ON public.billing_receipts;
CREATE TRIGGER audit_billing_receipt
AFTER INSERT OR UPDATE OR DELETE ON public.billing_receipts
FOR EACH ROW EXECUTE FUNCTION public.audit_billing_record();

DROP TRIGGER IF EXISTS audit_job_boost ON public.job_boosts;
CREATE TRIGGER audit_job_boost
AFTER INSERT OR UPDATE OR DELETE ON public.job_boosts
FOR EACH ROW EXECUTE FUNCTION public.audit_billing_record();

CREATE OR REPLACE FUNCTION public.audit_account_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_action TEXT;
BEGIN
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    AND NEW.deleted_at IS NOT NULL THEN
    audit_action := 'account.deleted';
  ELSIF NEW.deletion_requested_at IS DISTINCT FROM OLD.deletion_requested_at
    AND NEW.deletion_requested_at IS NOT NULL THEN
    audit_action := 'account.deletion_requested';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.append_security_audit(
    audit_action,
    'profile',
    NEW.id::TEXT,
    jsonb_build_object('user_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_account_deletion ON public.profiles;
CREATE TRIGGER audit_account_deletion
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_account_deletion();

REVOKE ALL ON FUNCTION public.audit_job_lifecycle() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_employer_invitation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_company_billing_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_billing_record() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_account_deletion() FROM PUBLIC;
