-- Public contact form submissions.

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  audience TEXT NOT NULL DEFAULT 'general',
  topic TEXT NOT NULL DEFAULT 'general',
  subject TEXT,
  message TEXT NOT NULL,
  source_path TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_audience_check CHECK (
    audience IN ('job_seeker', 'employer', 'partner', 'general')
  ),
  CONSTRAINT contact_messages_topic_check CHECK (
    topic IN (
      'candidate_support',
      'employer_sales',
      'billing',
      'privacy',
      'accessibility',
      'partnership',
      'general'
    )
  ),
  CONSTRAINT contact_messages_status_check CHECK (
    status IN ('new', 'in_review', 'resolved', 'spam')
  )
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
  ON public.contact_messages (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_topic_created
  ON public.contact_messages (topic, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_contact_messages_updated_at'
  ) THEN
    CREATE TRIGGER update_contact_messages_updated_at
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view contact messages"
ON public.contact_messages;

CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update contact messages"
ON public.contact_messages;

CREATE POLICY "Admins can update contact messages"
ON public.contact_messages FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
