-- Narrow schema-drift repair for personalized ranking and application autofill.
-- Do not rerun the broad 20260814 profile-parity migration because later
-- migrations intentionally removed demographic columns from profiles.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS level_of_experience TEXT;
