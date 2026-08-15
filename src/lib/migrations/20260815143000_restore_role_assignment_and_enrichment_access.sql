-- Forward-only remediation for production schema gaps discovered on 2026-08-15.

CREATE TABLE IF NOT EXISTS public.auth_role_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('assigned', 'preserved')),
  requested_role public.app_role NOT NULL,
  effective_role public.app_role NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('oauth_callback', 'role_selection')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS auth_role_audit_log_user_created_idx
ON public.auth_role_audit_log (user_id, created_at DESC);

REVOKE ALL ON TABLE public.auth_role_audit_log
FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.assign_initial_role(
  UUID, public.app_role, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.assign_initial_role(
  p_user_id UUID,
  p_role public.app_role,
  p_full_name TEXT,
  p_email TEXT,
  p_source TEXT
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

  IF p_source NOT IN ('oauth_callback', 'role_selection') THEN
    RAISE EXCEPTION 'Invalid role-assignment source';
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
    INSERT INTO public.auth_role_audit_log (
      user_id, event, requested_role, effective_role, source
    ) VALUES (
      p_user_id, 'preserved', p_role, existing_role, p_source
    );
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

  INSERT INTO public.auth_role_audit_log (
    user_id, event, requested_role, effective_role, source
  ) VALUES (
    p_user_id, 'assigned', p_role, p_role, p_source
  );

  RETURN p_role;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_initial_role(
  UUID, public.app_role, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.assign_initial_role(
  UUID, public.app_role, TEXT, TEXT, TEXT
) TO service_role;

ALTER TABLE public.job_enrichments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published job enrichments"
ON public.job_enrichments;

CREATE POLICY "Public can view published job enrichments"
ON public.job_enrichments
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = job_enrichments.job_id
      AND jobs.status = 'published'::public.job_status
      AND (jobs.expires_at IS NULL OR jobs.expires_at > now())
  )
);

GRANT SELECT ON public.job_enrichments TO anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.job_enrichments
FROM anon, authenticated;
