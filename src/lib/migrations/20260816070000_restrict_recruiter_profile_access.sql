-- Candidate profiles contain contact details, resume storage paths, and work
-- history. RLS is row-based, so allowing recruiters to select a public profile
-- also exposes every selected column through the Data API. Employer workflows
-- must instead pass server-side authentication, entitlement, and ownership
-- checks before using the narrowly scoped service-role readers in the app.

DROP POLICY IF EXISTS "Owners admins and recruiters can view profiles"
ON public.profiles;

DROP POLICY IF EXISTS "Owners admins and entitled recruiters can view profiles"
ON public.profiles;

DROP POLICY IF EXISTS "Owners and admins can view profiles"
ON public.profiles;

CREATE POLICY "Owners and admins can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);
