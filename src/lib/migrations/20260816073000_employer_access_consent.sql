-- Employer discovery and resume access require an explicit candidate action.
-- Existing public flags predate this disclosure and are not treated as consent.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employer_access_consent_at TIMESTAMPTZ;

UPDATE public.profiles
SET visibility = 'private'
WHERE visibility = 'public'
  AND employer_access_consent_at IS NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_public_requires_employer_consent;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_public_requires_employer_consent
  CHECK (
    visibility <> 'public'
    OR employer_access_consent_at IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS profiles_employer_discovery_idx
ON public.profiles (updated_at DESC)
WHERE visibility = 'public'
  AND employer_access_consent_at IS NOT NULL
  AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.clear_employer_consent_on_profile_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    NEW.visibility := 'private';
    NEW.employer_access_consent_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_employer_consent_on_profile_deletion()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS clear_employer_consent_on_profile_deletion
ON public.profiles;

CREATE TRIGGER clear_employer_consent_on_profile_deletion
BEFORE UPDATE OF deleted_at ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.clear_employer_consent_on_profile_deletion();
