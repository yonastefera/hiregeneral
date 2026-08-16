-- Remove only exact job-index duplicates after production ownership review.
-- Equivalent retained indexes are documented beside each removal.

-- Retained: jobs_category_idx ON (category)
DROP INDEX IF EXISTS public.idx_jobs_category;

-- Retained: constraint-owned jobs_slug_key ON (slug)
DROP INDEX IF EXISTS public.idx_jobs_slug;
DROP INDEX IF EXISTS public.idx_jobs_slug_unique;

-- Retained: constraint-owned jobs_source_name_source_id_key
-- ON (source_name, source_id)
DROP INDEX IF EXISTS public.idx_jobs_source_unique;

-- Retained: jobs_published_posted_at_idx ON (posted_at DESC)
-- WHERE status = 'published'
DROP INDEX IF EXISTS public.idx_jobs_published_posted_at;
