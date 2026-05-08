-- Close older Greenhouse per-job imports before switching Greenhouse to
-- canonical title-based source ids. Fresh ingestion will republish the
-- merged/capped Greenhouse roles.

UPDATE public.jobs
SET
  status = 'closed',
  expires_at = COALESCE(expires_at, NOW()),
  updated_at = NOW()
WHERE status = 'published'
  AND source_name = 'greenhouse'
  AND source_id NOT LIKE '%:role:%';
