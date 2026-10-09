-- Remove clearly Indian listings that were published when the `IN` country
-- token could be mistaken for Indiana. Rows remain available for audit.
UPDATE public.jobs
SET
  status = 'closed',
  expires_at = LEAST(COALESCE(expires_at, NOW()), NOW()),
  updated_at = NOW()
WHERE status = 'published'
  AND location ~* '(^|[[:space:],/()_-])(india|hyderabad|telangana|bengaluru|bangalore|karnataka|chennai|pune|mumbai|maharashtra|gurugram|gurgaon|noida)([[:space:],/()_-]|$)';
