-- Give the broader Bank of America IT ingestion enough time to finish.

UPDATE public.job_sources
SET
  metadata = jsonb_set(
    metadata,
    '{sourceTimeoutMs}',
    '600000'::jsonb,
    true
  ),
  notes = 'Workday source. Uses a broad Bank of America IT keyword batch before US/engineering filters with a longer per-source timeout.'
WHERE source_type = 'workday'
  AND source_slug = 'Lateral-US';
