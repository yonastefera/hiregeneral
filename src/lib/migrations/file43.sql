-- Resume database performance indexes for employer candidate search.

CREATE INDEX IF NOT EXISTS idx_profiles_public_updated
  ON public.profiles (visibility, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_public_resume_updated
  ON public.profiles (visibility, updated_at DESC)
  WHERE deleted_at IS NULL
    AND resume_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_skills_gin
  ON public.profiles
  USING GIN (skills);
