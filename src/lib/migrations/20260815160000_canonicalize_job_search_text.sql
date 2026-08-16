-- Canonicalize the indexed public job-search document so it matches the API's
-- title/company/description/category keyword behavior in every environment.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS search_text TEXT;

CREATE OR REPLACE FUNCTION public.set_job_search_text()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_text := lower(
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.company_name, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.category, '')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS maintain_job_search_text ON public.jobs;

CREATE TRIGGER maintain_job_search_text
BEFORE INSERT OR UPDATE OF title, company_name, description, category
ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_job_search_text();

UPDATE public.jobs
SET search_text = lower(
  coalesce(title, '') || ' ' ||
  coalesce(company_name, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(category, '')
)
WHERE search_text IS DISTINCT FROM lower(
  coalesce(title, '') || ' ' ||
  coalesce(company_name, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(category, '')
);

CREATE INDEX IF NOT EXISTS jobs_search_text_trgm_idx
  ON public.jobs USING gin (search_text gin_trgm_ops);

ANALYZE public.jobs;
