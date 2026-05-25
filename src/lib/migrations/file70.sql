CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.salary_benchmarks (
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
  source_name TEXT NOT NULL DEFAULT 'U.S. Bureau of Labor Statistics OEWS',
  source_url TEXT NOT NULL DEFAULT 'https://download.bls.gov/pub/time.series/oe/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (release_year, occupation_code, area_code)
);

CREATE INDEX IF NOT EXISTS salary_benchmarks_lookup_idx
  ON public.salary_benchmarks (release_year DESC, occupation_code, area_type, area_code);

CREATE INDEX IF NOT EXISTS salary_benchmarks_area_trgm_idx
  ON public.salary_benchmarks USING gin (area_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS salary_benchmarks_occupation_trgm_idx
  ON public.salary_benchmarks USING gin (occupation_search_text gin_trgm_ops);

ALTER TABLE public.salary_benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view salary benchmarks" ON public.salary_benchmarks;
CREATE POLICY "Public can view salary benchmarks"
  ON public.salary_benchmarks
  FOR SELECT
  TO anon, authenticated
  USING (true);

DO $$
BEGIN
  IF to_regclass('public.salary_bls_oews') IS NOT NULL THEN
    EXECUTE $backfill$
      INSERT INTO public.salary_benchmarks (
        release_period,
        release_year,
        occupation_code,
        occupation_name,
        area_type,
        area_code,
        area_name,
        state_code,
        employment,
        annual_mean,
        annual_p10,
        annual_p25,
        annual_median,
        annual_p75,
        annual_p90,
        hourly_median,
        source_url,
        created_at,
        updated_at
      )
      SELECT
        release_period,
        release_year,
        occupation_code,
        occupation_name,
        area_type,
        area_code,
        area_name,
        state_code,
        employment,
        annual_mean,
        annual_p10,
        annual_p25,
        annual_median,
        annual_p75,
        annual_p90,
        hourly_median,
        source_url,
        created_at,
        updated_at
      FROM public.salary_bls_oews
      ON CONFLICT (release_year, occupation_code, area_code) DO NOTHING
    $backfill$;
  END IF;
END $$;
