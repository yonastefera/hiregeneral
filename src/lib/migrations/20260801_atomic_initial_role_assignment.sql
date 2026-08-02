CREATE OR REPLACE FUNCTION public.assign_initial_role(
  p_user_id UUID,
  p_role public.app_role,
  p_full_name TEXT,
  p_email TEXT
)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_role public.app_role;
BEGIN
  IF p_role = 'admin' THEN
    RAISE EXCEPTION 'Admin roles require a privileged administrative process';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT role INTO existing_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'recruiter' THEN 2
    ELSE 3
  END
  LIMIT 1;

  IF existing_role IS NOT NULL THEN
    RETURN existing_role;
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email, user_type)
  VALUES (p_user_id, NULLIF(p_full_name, ''), p_email, p_role)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    user_type = EXCLUDED.user_type;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role);

  RETURN p_role;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_initial_role(UUID, public.app_role, TEXT, TEXT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_initial_role(UUID, public.app_role, TEXT, TEXT)
TO service_role;
