-- Two-phase account deletion. Preparation is retryable until the external
-- worker removes storage and the Supabase Auth identity, then marks completion.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_deletion_execution_idx
  ON public.profiles (deletion_requested_at)
  WHERE deletion_requested_at IS NOT NULL
    AND deletion_completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.prepare_account_deletion(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate_profile public.profiles%ROWTYPE;
BEGIN
  SELECT *
  INTO candidate_profile
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account profile not found' USING ERRCODE = 'P0002';
  END IF;

  IF candidate_profile.deletion_requested_at IS NULL
    OR candidate_profile.deletion_requested_at > now() - interval '14 days' THEN
    RAISE EXCEPTION 'Account deletion grace period has not elapsed'
      USING ERRCODE = '23514';
  END IF;

  IF candidate_profile.deletion_completed_at IS NOT NULL THEN
    RETURN jsonb_build_object('prepared', true, 'already_completed', true);
  END IF;

  DELETE FROM public.employer_candidate_invites
  WHERE recruiter_id = p_user_id
    OR candidate_id = candidate_profile.id;

  DELETE FROM public.conversations
  WHERE participant_one = p_user_id OR participant_two = p_user_id;

  DELETE FROM public.applications WHERE user_id = p_user_id;
  DELETE FROM public.saved_jobs WHERE user_id = p_user_id;
  DELETE FROM public.notifications WHERE user_id = p_user_id;
  DELETE FROM public.notification_preferences WHERE user_id = p_user_id;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;

  UPDATE public.jobs
  SET status = 'closed', notification_email = NULL
  WHERE recruiter_id = p_user_id;

  -- Retain billing/company records under the pseudonymous UUID so receipts and
  -- webhook ownership remain reconcilable, while removing contact PII.
  UPDATE public.companies
  SET billing_email = NULL
  WHERE owner_id = p_user_id;

  IF candidate_profile.deleted_at IS NULL THEN
    UPDATE public.profiles
    SET
      full_name = 'Deleted user',
      headline = NULL,
      location = NULL,
      city = NULL,
      state = NULL,
      zip_code = NULL,
      phone = NULL,
      email = NULL,
      resume_url = NULL,
      resume_file_name = NULL,
      resume_file_size = NULL,
      resume_uploaded_at = NULL,
      resume_scan_status = NULL,
      avatar_url = NULL,
      avatar_file_name = NULL,
      avatar_uploaded_at = NULL,
      skills = '{}'::text[],
      additional_info = NULL,
      executive_summary = NULL,
      objective = NULL,
      work_experience = '[]'::jsonb,
      education = '[]'::jsonb,
      achievements = '[]'::jsonb,
      licenses_certifications = '[]'::jsonb,
      profile_links = '[]'::jsonb,
      level_of_experience = NULL,
      highest_degree = NULL,
      industry = NULL,
      minimum_desired_pay = NULL,
      open_to_relocation = false,
      gender = NULL,
      gender_self_describe = NULL,
      ethnicity = NULL,
      ethnicity_self_describe = NULL,
      veteran_status = NULL,
      disability_status = NULL,
      visibility = 'private',
      deleted_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('prepared', true, 'already_completed', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_account_deletion(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET deletion_completed_at = COALESCE(deletion_completed_at, now())
  WHERE user_id = p_user_id
    AND deleted_at IS NOT NULL
    AND deletion_requested_at <= now() - interval '14 days';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prepared account deletion not found'
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_account_deletion(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_account_deletion(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.prepare_account_deletion(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_account_deletion(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.complete_account_deletion(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_account_deletion(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.complete_account_deletion(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.complete_account_deletion(uuid) TO service_role;
