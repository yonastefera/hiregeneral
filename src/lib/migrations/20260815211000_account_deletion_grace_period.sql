-- Enforce a recoverable 14-day account-deletion grace period.

CREATE INDEX IF NOT EXISTS profiles_pending_deletion_idx
  ON public.profiles (deletion_requested_at)
  WHERE deletion_requested_at IS NOT NULL
    AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.enforce_account_deletion_grace_period()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    AND NEW.deleted_at IS NOT NULL
    AND (
      OLD.deletion_requested_at IS NULL
      OR OLD.deletion_requested_at > now() - interval '14 days'
    ) THEN
    RAISE EXCEPTION 'Account deletion grace period has not elapsed'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_account_deletion_grace_period
ON public.profiles;

CREATE TRIGGER enforce_account_deletion_grace_period
BEFORE UPDATE OF deleted_at ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_account_deletion_grace_period();

CREATE OR REPLACE FUNCTION public.audit_account_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_action TEXT;
BEGIN
  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    AND NEW.deleted_at IS NOT NULL THEN
    audit_action := 'account.deleted';
  ELSIF NEW.deletion_requested_at IS DISTINCT FROM OLD.deletion_requested_at
    AND NEW.deletion_requested_at IS NOT NULL THEN
    audit_action := 'account.deletion_requested';
  ELSIF NEW.deletion_requested_at IS DISTINCT FROM OLD.deletion_requested_at
    AND NEW.deletion_requested_at IS NULL
    AND OLD.deletion_requested_at IS NOT NULL THEN
    audit_action := 'account.deletion_cancelled';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.append_security_audit(
    audit_action,
    'profile',
    NEW.id::TEXT,
    jsonb_build_object('user_id', NEW.user_id)
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_account_deletion_grace_period()
FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_account_deletion() FROM PUBLIC;
