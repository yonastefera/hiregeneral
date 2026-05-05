CREATE TYPE public.app_role AS ENUM ('admin', 'recruiter', 'job_seeker');
CREATE TYPE public.job_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE public.profile_visibility AS ENUM ('public', 'private');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  headline TEXT,
  user_type public.app_role NOT NULL DEFAULT 'job_seeker',
  location TEXT,
  phone TEXT,
  email TEXT,
  resume_url TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  additional_info TEXT,
  gender TEXT,
  ethnicity TEXT,
  veteran_status TEXT,
  disability_status TEXT,
  visibility public.profile_visibility NOT NULL DEFAULT 'private',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  work_mode TEXT NOT NULL DEFAULT 'Hybrid',
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT NOT NULL DEFAULT 'USD',
  skills TEXT[] NOT NULL DEFAULT '{}',
  status public.job_status NOT NULL DEFAULT 'published',
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_note TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_jobs_search ON public.jobs USING GIN (to_tsvector('english', title || ' ' || company_name || ' ' || description || ' ' || location));
CREATE INDEX idx_jobs_posted_at ON public.jobs (posted_at DESC);
CREATE INDEX idx_jobs_status ON public.jobs (status);
CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs (user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public profiles are viewable, owners and admins can view private"
ON public.profiles FOR SELECT
USING (visibility = 'public' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies are publicly viewable"
ON public.companies FOR SELECT
USING (true);

CREATE POLICY "Recruiters can create companies"
ON public.companies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id AND (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Recruiters can manage their companies"
ON public.companies FOR UPDATE TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Published jobs are publicly viewable"
ON public.jobs FOR SELECT
USING (status = 'published' OR auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can create jobs"
ON public.jobs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = recruiter_id AND (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Recruiters can manage their jobs"
ON public.jobs FOR UPDATE TO authenticated
USING (auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = recruiter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view saved jobs"
ON public.saved_jobs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs"
ON public.saved_jobs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved jobs"
ON public.saved_jobs FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Applicants and recruiters can view applications"
ON public.applications FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
);

CREATE POLICY "Users can submit applications"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and recruiters can update applications"
ON public.applications FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
)
WITH CHECK (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
);