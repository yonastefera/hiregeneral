-- Close imported non-US jobs that slipped through earlier location filtering.
-- We keep the rows for history, but remove them from the published browse set.

UPDATE public.jobs
SET
  status = 'closed',
  expires_at = COALESCE(expires_at, NOW()),
  updated_at = NOW()
WHERE status = 'published'
  AND source_name IS NOT NULL
  AND (
    location ILIKE '%china%'
    OR location ILIKE '%shanghai%'
    OR location ILIKE '%beijing%'
    OR location ILIKE '%dalian%'
    OR location ILIKE '%hong kong%'
    OR location ILIKE '%singapore%'
    OR location ILIKE '%india%'
    OR location ILIKE '%bengaluru%'
    OR location ILIKE '%bangalore%'
    OR location ILIKE '%japan%'
    OR location ILIKE '%tokyo%'
    OR location ILIKE '%australia%'
    OR location ILIKE '%sydney%'
    OR location ILIKE '%melbourne%'
    OR location ILIKE '%united kingdom%'
    OR location ILIKE '%london%'
    OR location ILIKE '%ireland%'
    OR location ILIKE '%germany%'
    OR location ILIKE '%france%'
    OR location ILIKE '%spain%'
    OR location ILIKE '%italy%'
    OR location ILIKE '%netherlands%'
    OR location ILIKE '%poland%'
    OR location ILIKE '%romania%'
    OR location ILIKE '%europe%'
    OR location ILIKE '%emea%'
  );
