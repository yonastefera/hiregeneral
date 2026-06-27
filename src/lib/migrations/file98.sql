-- Disable Oliver USA for now: the public Greenhouse board is valid, but it
-- currently has account, creative, social, and program roles rather than
-- technology/data roles for the HireGeneral pool.

UPDATE public.job_sources
SET
  enabled = false,
  metadata = jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{adapterNeeded}',
      '"review-non-technology-greenhouse-board"'::jsonb,
      true
    ),
    '{requireUs}',
    'true'::jsonb,
    true
  ),
  notes = 'Backlog source. Oliver USA is a valid Greenhouse board, but the current public roles are account, creative, social, and program roles rather than technology or data jobs.',
  updated_at = now()
WHERE source_slug = 'oliverusa';
