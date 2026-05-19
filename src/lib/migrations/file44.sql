-- Employer company profile fields used by the dashboard company profile editor.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT;

CREATE INDEX IF NOT EXISTS idx_companies_owner_updated
  ON public.companies (owner_id, updated_at DESC);
