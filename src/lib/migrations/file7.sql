-- Configurable ATS/feed/scraper sources for job ingestion.
CREATE TABLE IF NOT EXISTS public.job_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_domain TEXT,
  company_logo_url TEXT,
  source_type TEXT NOT NULL
    CHECK (source_type IN ('greenhouse', 'lever', 'workday', 'ashby', 'rss', 'csv', 'scraper')),
  source_slug TEXT NOT NULL,
  source_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_slug)
);

CREATE INDEX IF NOT EXISTS idx_job_sources_enabled
  ON public.job_sources (enabled);

CREATE INDEX IF NOT EXISTS idx_job_sources_company
  ON public.job_sources (company_name);

ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view job sources"
ON public.job_sources;

DROP POLICY IF EXISTS "Admins can manage job sources"
ON public.job_sources;

CREATE POLICY "Admins can view job sources"
ON public.job_sources FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage job sources"
ON public.job_sources FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_job_sources_updated_at ON public.job_sources;
CREATE TRIGGER update_job_sources_updated_at
BEFORE UPDATE ON public.job_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.job_sources (
  company_name,
  company_domain,
  source_type,
  source_slug,
  source_url,
  enabled
)
VALUES (
  'Stripe',
  'stripe.com',
  'greenhouse',
  'stripe',
  'https://boards.greenhouse.io/stripe',
  true
)
ON CONFLICT (source_type, source_slug) DO UPDATE
SET
  company_name = EXCLUDED.company_name,
  company_domain = EXCLUDED.company_domain,
  source_url = EXCLUDED.source_url,
  enabled = EXCLUDED.enabled;
