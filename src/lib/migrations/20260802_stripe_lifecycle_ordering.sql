-- Apply Stripe subscription state atomically, reject customer/company
-- mismatches, and ignore events older than the last applied Stripe event.

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS billing_last_event_created BIGINT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS companies_stripe_customer_unique
ON public.companies (stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS companies_stripe_subscription_unique
ON public.companies (stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.apply_company_billing_event(
  p_company_id UUID,
  p_customer_id TEXT,
  p_subscription_id TEXT,
  p_plan TEXT,
  p_status TEXT,
  p_current_period_end TIMESTAMPTZ,
  p_active_job_limit INTEGER,
  p_event_created BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_company public.companies%ROWTYPE;
BEGIN
  IF p_event_created IS NULL OR p_event_created <= 0 THEN
    RAISE EXCEPTION 'Invalid Stripe event timestamp'
      USING ERRCODE = '22023';
  END IF;

  IF p_company_id IS NOT NULL THEN
    SELECT * INTO target_company
    FROM public.companies
    WHERE id = p_company_id
    FOR UPDATE;
  ELSIF p_customer_id IS NOT NULL THEN
    SELECT * INTO target_company
    FROM public.companies
    WHERE stripe_customer_id = p_customer_id
    FOR UPDATE;
  ELSIF p_subscription_id IS NOT NULL THEN
    SELECT * INTO target_company
    FROM public.companies
    WHERE stripe_subscription_id = p_subscription_id
    FOR UPDATE;
  END IF;

  IF target_company.id IS NULL THEN
    RAISE EXCEPTION 'Stripe event does not map to a company'
      USING ERRCODE = '23503';
  END IF;

  IF p_customer_id IS NOT NULL
    AND target_company.stripe_customer_id IS NOT NULL
    AND target_company.stripe_customer_id IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'Stripe customer does not belong to company'
      USING ERRCODE = '42501';
  END IF;

  IF p_subscription_id IS NOT NULL
    AND target_company.stripe_subscription_id IS NOT NULL
    AND target_company.stripe_subscription_id IS DISTINCT FROM p_subscription_id THEN
    RAISE EXCEPTION 'Stripe subscription does not belong to company'
      USING ERRCODE = '42501';
  END IF;

  IF p_event_created < target_company.billing_last_event_created THEN
    RETURN FALSE;
  END IF;

  UPDATE public.companies
  SET stripe_customer_id = COALESCE(p_customer_id, stripe_customer_id),
      stripe_subscription_id = COALESCE(
        p_subscription_id,
        stripe_subscription_id
      ),
      billing_plan = COALESCE(p_plan, billing_plan),
      subscription_status = COALESCE(p_status, subscription_status),
      current_period_end = COALESCE(
        p_current_period_end,
        current_period_end
      ),
      active_job_limit = COALESCE(p_active_job_limit, active_job_limit),
      billing_last_event_created = p_event_created
  WHERE id = target_company.id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_company_billing_event(
  UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, INTEGER, BIGINT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_company_billing_event(
  UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, INTEGER, BIGINT
) TO service_role;
