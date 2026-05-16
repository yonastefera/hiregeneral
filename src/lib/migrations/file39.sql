CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.salary_bls_oews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_period TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  occupation_code TEXT NOT NULL,
  occupation_name TEXT NOT NULL,
  occupation_search_text TEXT GENERATED ALWAYS AS (
    lower(occupation_code || ' ' || occupation_name)
  ) STORED,
  area_type TEXT NOT NULL,
  area_code TEXT NOT NULL,
  area_name TEXT NOT NULL,
  state_code TEXT,
  employment INTEGER,
  annual_mean INTEGER,
  annual_p10 INTEGER,
  annual_p25 INTEGER,
  annual_median INTEGER,
  annual_p75 INTEGER,
  annual_p90 INTEGER,
  hourly_median NUMERIC(12, 2),
  source_url TEXT NOT NULL DEFAULT 'https://download.bls.gov/pub/time.series/oe/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (release_year, occupation_code, area_code)
);

CREATE INDEX IF NOT EXISTS salary_bls_oews_lookup_idx
  ON public.salary_bls_oews (release_year DESC, occupation_code, area_type, area_code);

CREATE INDEX IF NOT EXISTS salary_bls_oews_area_trgm_idx
  ON public.salary_bls_oews USING gin (area_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS salary_bls_oews_occupation_trgm_idx
  ON public.salary_bls_oews USING gin (occupation_search_text gin_trgm_ops);

ALTER TABLE public.salary_bls_oews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view BLS salary benchmarks" ON public.salary_bls_oews;
CREATE POLICY "Public can view BLS salary benchmarks"
  ON public.salary_bls_oews
  FOR SELECT
  TO anon, authenticated
  USING (true);
