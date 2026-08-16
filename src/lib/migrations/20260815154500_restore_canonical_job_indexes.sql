-- Restore canonical jobs index coverage in environments that did not contain
-- the production-retained equivalents before duplicate index cleanup.

CREATE INDEX IF NOT EXISTS jobs_category_idx
  ON public.jobs (category);

CREATE INDEX IF NOT EXISTS jobs_published_posted_at_idx
  ON public.jobs (posted_at DESC)
  WHERE status = 'published';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.jobs'::regclass
      AND conname = 'jobs_slug_key'
      AND contype = 'u'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS jobs_slug_key
      ON public.jobs (slug);

    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_slug_key UNIQUE USING INDEX jobs_slug_key;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.jobs'::regclass
      AND conname = 'jobs_source_name_source_id_key'
      AND contype = 'u'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS jobs_source_name_source_id_key
      ON public.jobs (source_name, source_id);

    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_source_name_source_id_key
      UNIQUE USING INDEX jobs_source_name_source_id_key;
  END IF;
END
$$;
