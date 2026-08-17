-- Append-only evidence of the exact published legal documents a user accepted.
-- Draft documents are intentionally not seeded or accepted.

CREATE TABLE IF NOT EXISTS public.legal_policy_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy')),
  document_version TEXT NOT NULL CHECK (
    length(document_version) BETWEEN 1 AND 100
  ),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL CHECK (source IN ('role_selection')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT legal_policy_acceptances_version_unique
    UNIQUE (user_id, document_type, document_version)
);

CREATE INDEX IF NOT EXISTS legal_policy_acceptances_user_time_idx
  ON public.legal_policy_acceptances (user_id, accepted_at DESC);

ALTER TABLE public.legal_policy_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own policy acceptances"
  ON public.legal_policy_acceptances;

CREATE POLICY "Users can view own policy acceptances"
  ON public.legal_policy_acceptances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON TABLE public.legal_policy_acceptances
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.legal_policy_acceptances TO authenticated;

COMMENT ON TABLE public.legal_policy_acceptances IS
  'Server-written, append-only evidence of published Terms and Privacy acceptance.';
