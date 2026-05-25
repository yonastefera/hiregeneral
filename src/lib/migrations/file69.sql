-- Correct HelloFresh Phenom country facet. Their public API uses
-- "United States", not "United States of America".

UPDATE public.job_sources
SET
  metadata = jsonb_set(
    metadata,
    '{selectedFields,country}',
    '["United States"]'::jsonb,
    true
  ),
  updated_at = now()
WHERE source_type = 'phenom'
  AND source_slug = 'hellofresh-phenom';
