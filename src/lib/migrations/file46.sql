ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_plan TEXT NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_job_limit INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS account_credit_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boost_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_email TEXT;

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  invoice_number TEXT,
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_stripe_customer_id
ON public.companies (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_companies_stripe_subscription_id
ON public.companies (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_billing_receipts_company_paid_at
ON public.billing_receipts (company_id, paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_boosts_company_ends_at
ON public.job_boosts (company_id, ends_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_job_boosts_updated_at'
  ) THEN
    CREATE TRIGGER update_job_boosts_updated_at
    BEFORE UPDATE ON public.job_boosts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_boosts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'billing_events'
      AND policyname = 'Admins can view billing events'
  ) THEN
    CREATE POLICY "Admins can view billing events"
    ON public.billing_events FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'billing_receipts'
      AND policyname = 'Employers can view their billing receipts'
  ) THEN
    CREATE POLICY "Employers can view their billing receipts"
    ON public.billing_receipts FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.companies
        WHERE companies.id = billing_receipts.company_id
          AND companies.owner_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_boosts'
      AND policyname = 'Employers can view their job boosts'
  ) THEN
    CREATE POLICY "Employers can view their job boosts"
    ON public.job_boosts FOR SELECT TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.companies
        WHERE companies.id = job_boosts.company_id
          AND companies.owner_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'job_boosts'
      AND policyname = 'Employers can manage their job boosts'
  ) THEN
    CREATE POLICY "Employers can manage their job boosts"
    ON public.job_boosts FOR ALL TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.companies
        WHERE companies.id = job_boosts.company_id
          AND companies.owner_id = auth.uid()
      )
    )
    WITH CHECK (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.companies
        WHERE companies.id = job_boosts.company_id
          AND companies.owner_id = auth.uid()
      )
    );
  END IF;
END $$;
