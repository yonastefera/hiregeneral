-- Keep the applications table aligned with the validated application form and
-- the immutable-identity fields protected by protect_application_update().
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS applicant_full_name TEXT,
  ADD COLUMN IF NOT EXISTS applicant_email TEXT,
  ADD COLUMN IF NOT EXISTS applicant_phone TEXT,
  ADD COLUMN IF NOT EXISTS applicant_location TEXT,
  ADD COLUMN IF NOT EXISTS applicant_linkedin TEXT,
  ADD COLUMN IF NOT EXISTS applicant_portfolio TEXT,
  ADD COLUMN IF NOT EXISTS years_experience TEXT,
  ADD COLUMN IF NOT EXISTS work_authorization TEXT,
  ADD COLUMN IF NOT EXISTS requires_sponsorship TEXT NOT NULL DEFAULT 'no';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.applications'::regclass
      AND conname = 'applications_years_experience_check'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_years_experience_check
      CHECK (
        years_experience IS NULL
        OR years_experience IN ('0-1', '2-4', '5-7', '8+')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.applications'::regclass
      AND conname = 'applications_work_authorization_check'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_work_authorization_check
      CHECK (
        work_authorization IS NULL
        OR work_authorization IN ('citizen', 'permanent', 'visa', 'other')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.applications'::regclass
      AND conname = 'applications_requires_sponsorship_check'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_requires_sponsorship_check
      CHECK (requires_sponsorship IN ('no', 'yes', 'future'));
  END IF;
END
$$;
