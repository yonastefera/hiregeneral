-- Move optional demographic responses out of employer-readable profiles.
-- Legacy columns remain temporarily for deployment compatibility, but are
-- cleared and constrained to NULL until a later contract migration drops them.

CREATE TABLE IF NOT EXISTS public.profile_demographics (
  profile_id uuid PRIMARY KEY
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  gender text,
  gender_self_describe text,
  ethnicity text,
  ethnicity_self_describe text,
  veteran_status text,
  disability_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.profile_demographics (
  profile_id,
  user_id,
  gender,
  gender_self_describe,
  ethnicity,
  ethnicity_self_describe,
  veteran_status,
  disability_status
)
SELECT
  id,
  user_id,
  gender,
  gender_self_describe,
  ethnicity,
  ethnicity_self_describe,
  veteran_status,
  disability_status
FROM public.profiles
WHERE gender IS NOT NULL
   OR gender_self_describe IS NOT NULL
   OR ethnicity IS NOT NULL
   OR ethnicity_self_describe IS NOT NULL
   OR veteran_status IS NOT NULL
   OR disability_status IS NOT NULL
ON CONFLICT (profile_id) DO UPDATE SET
  gender = EXCLUDED.gender,
  gender_self_describe = EXCLUDED.gender_self_describe,
  ethnicity = EXCLUDED.ethnicity,
  ethnicity_self_describe = EXCLUDED.ethnicity_self_describe,
  veteran_status = EXCLUDED.veteran_status,
  disability_status = EXCLUDED.disability_status,
  updated_at = now();

UPDATE public.profiles
SET
  gender = NULL,
  gender_self_describe = NULL,
  ethnicity = NULL,
  ethnicity_self_describe = NULL,
  veteran_status = NULL,
  disability_status = NULL
WHERE gender IS NOT NULL
   OR gender_self_describe IS NOT NULL
   OR ethnicity IS NOT NULL
   OR ethnicity_self_describe IS NOT NULL
   OR veteran_status IS NOT NULL
   OR disability_status IS NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_demographics_separated;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_demographics_separated CHECK (
    gender IS NULL
    AND gender_self_describe IS NULL
    AND ethnicity IS NULL
    AND ethnicity_self_describe IS NULL
    AND veteran_status IS NULL
    AND disability_status IS NULL
  );

ALTER TABLE public.profile_demographics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own demographics"
ON public.profile_demographics;
CREATE POLICY "Users can view own demographics"
ON public.profile_demographics FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own demographics"
ON public.profile_demographics;
CREATE POLICY "Users can insert own demographics"
ON public.profile_demographics FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = profile_demographics.profile_id
      AND profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own demographics"
ON public.profile_demographics;
CREATE POLICY "Users can update own demographics"
ON public.profile_demographics FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = profile_demographics.profile_id
      AND profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own demographics"
ON public.profile_demographics;
CREATE POLICY "Users can delete own demographics"
ON public.profile_demographics FOR DELETE TO authenticated
USING (auth.uid() = user_id);

REVOKE ALL ON TABLE public.profile_demographics FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_demographics
TO authenticated;

DROP TRIGGER IF EXISTS update_profile_demographics_updated_at
ON public.profile_demographics;
CREATE TRIGGER update_profile_demographics_updated_at
BEFORE UPDATE ON public.profile_demographics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.delete_demographics_for_deleted_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL
    AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    DELETE FROM public.profile_demographics WHERE profile_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delete_demographics_for_deleted_profile
ON public.profiles;
CREATE TRIGGER delete_demographics_for_deleted_profile
AFTER UPDATE OF deleted_at ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.delete_demographics_for_deleted_profile();

REVOKE ALL ON FUNCTION public.delete_demographics_for_deleted_profile()
FROM PUBLIC, anon, authenticated;
