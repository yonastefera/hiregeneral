-- Deterministic skills/title ontology and asynchronous job enrichment.
CREATE OR REPLACE FUNCTION public.normalize_knowledge_term(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
RETURNS NULL ON NULL INPUT
SET search_path = public
AS $$
  SELECT btrim(regexp_replace(lower(value), '[^a-z0-9+#.]+', ' ', 'g'));
$$;

CREATE TABLE public.knowledge_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  canonical_name TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'hiregeneral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.knowledge_skill_aliases (
  skill_id UUID NOT NULL REFERENCES public.knowledge_skills(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT GENERATED ALWAYS AS (
    public.normalize_knowledge_term(alias)
  ) STORED,
  PRIMARY KEY (skill_id, alias),
  UNIQUE (normalized_alias)
);

CREATE TABLE public.knowledge_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  canonical_title TEXT NOT NULL,
  family TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'hiregeneral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.knowledge_title_aliases (
  title_id UUID NOT NULL REFERENCES public.knowledge_titles(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  normalized_alias TEXT GENERATED ALWAYS AS (
    public.normalize_knowledge_term(alias)
  ) STORED,
  PRIMARY KEY (title_id, alias),
  UNIQUE (normalized_alias)
);

CREATE TABLE public.knowledge_title_skills (
  title_id UUID NOT NULL REFERENCES public.knowledge_titles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.knowledge_skills(id) ON DELETE CASCADE,
  weight SMALLINT NOT NULL DEFAULT 50 CHECK (weight BETWEEN 1 AND 100),
  PRIMARY KEY (title_id, skill_id)
);

CREATE TABLE public.job_knowledge_titles (
  job_id UUID PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
  title_id UUID NOT NULL REFERENCES public.knowledge_titles(id) ON DELETE CASCADE,
  matched_alias TEXT NOT NULL,
  confidence SMALLINT NOT NULL CHECK (confidence BETWEEN 1 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_knowledge_titles_title
  ON public.job_knowledge_titles (title_id, job_id);

CREATE TABLE public.job_knowledge_skills (
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.knowledge_skills(id) ON DELETE CASCADE,
  matched_alias TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, skill_id)
);

CREATE INDEX idx_job_knowledge_skills_skill
  ON public.job_knowledge_skills (skill_id, job_id);

CREATE TABLE public.job_knowledge_enrichment_queue (
  job_id UUID PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_knowledge_enrichment_queue_age
  ON public.job_knowledge_enrichment_queue (queued_at, job_id);

ALTER TABLE public.knowledge_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_skill_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_title_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_title_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_knowledge_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_knowledge_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_knowledge_enrichment_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Knowledge skills are public reference data"
ON public.knowledge_skills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Knowledge skill aliases are public reference data"
ON public.knowledge_skill_aliases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Knowledge titles are public reference data"
ON public.knowledge_titles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Knowledge title aliases are public reference data"
ON public.knowledge_title_aliases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Title skill edges are public reference data"
ON public.knowledge_title_skills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Published job title mappings are public"
ON public.job_knowledge_titles FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs
  WHERE jobs.id = job_id AND jobs.status = 'published'
));
CREATE POLICY "Published job skill mappings are public"
ON public.job_knowledge_skills FOR SELECT TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.jobs
  WHERE jobs.id = job_id AND jobs.status = 'published'
));

GRANT SELECT ON TABLE
  public.knowledge_skills,
  public.knowledge_skill_aliases,
  public.knowledge_titles,
  public.knowledge_title_aliases,
  public.knowledge_title_skills,
  public.job_knowledge_titles,
  public.job_knowledge_skills
TO anon, authenticated;

INSERT INTO public.knowledge_skills (slug, canonical_name, category) VALUES
  ('javascript', 'JavaScript', 'programming-language'),
  ('typescript', 'TypeScript', 'programming-language'),
  ('python', 'Python', 'programming-language'),
  ('java', 'Java', 'programming-language'),
  ('c-sharp', 'C#', 'programming-language'),
  ('c-plus-plus', 'C++', 'programming-language'),
  ('sql', 'SQL', 'data'),
  ('react', 'React', 'frontend'),
  ('next-js', 'Next.js', 'frontend'),
  ('node-js', 'Node.js', 'backend'),
  ('dotnet', '.NET', 'backend'),
  ('spring-boot', 'Spring Boot', 'backend'),
  ('postgresql', 'PostgreSQL', 'data'),
  ('mysql', 'MySQL', 'data'),
  ('aws', 'Amazon Web Services', 'cloud'),
  ('azure', 'Microsoft Azure', 'cloud'),
  ('gcp', 'Google Cloud Platform', 'cloud'),
  ('docker', 'Docker', 'platform'),
  ('kubernetes', 'Kubernetes', 'platform'),
  ('terraform', 'Terraform', 'platform'),
  ('machine-learning', 'Machine Learning', 'data-science'),
  ('data-analysis', 'Data Analysis', 'data'),
  ('tableau', 'Tableau', 'analytics'),
  ('power-bi', 'Power BI', 'analytics'),
  ('product-management', 'Product Management', 'product'),
  ('project-management', 'Project Management', 'operations'),
  ('salesforce', 'Salesforce', 'business-system'),
  ('figma', 'Figma', 'design'),
  ('user-research', 'User Research', 'design'),
  ('cybersecurity', 'Cybersecurity', 'security');

INSERT INTO public.knowledge_skill_aliases (skill_id, alias)
SELECT skill.id, aliases.alias
FROM (VALUES
  ('javascript', ARRAY['JavaScript', 'JS', 'ECMAScript']),
  ('typescript', ARRAY['TypeScript', 'TS']),
  ('python', ARRAY['Python']), ('java', ARRAY['Java']),
  ('c-sharp', ARRAY['C#', 'C Sharp']), ('c-plus-plus', ARRAY['C++', 'CPP']),
  ('sql', ARRAY['SQL']), ('react', ARRAY['React', 'React.js', 'ReactJS']),
  ('next-js', ARRAY['Next.js', 'NextJS']),
  ('node-js', ARRAY['Node.js', 'NodeJS']),
  ('dotnet', ARRAY['.NET', 'dotnet', 'ASP.NET']),
  ('spring-boot', ARRAY['Spring Boot']),
  ('postgresql', ARRAY['PostgreSQL', 'Postgres']), ('mysql', ARRAY['MySQL']),
  ('aws', ARRAY['Amazon Web Services', 'AWS']),
  ('azure', ARRAY['Microsoft Azure', 'Azure']),
  ('gcp', ARRAY['Google Cloud Platform', 'GCP']), ('docker', ARRAY['Docker']),
  ('kubernetes', ARRAY['Kubernetes', 'K8s']),
  ('terraform', ARRAY['Terraform']),
  ('machine-learning', ARRAY['Machine Learning', 'ML']),
  ('data-analysis', ARRAY['Data Analysis', 'Data Analytics']),
  ('tableau', ARRAY['Tableau']), ('power-bi', ARRAY['Power BI', 'PowerBI']),
  ('product-management', ARRAY['Product Management']),
  ('project-management', ARRAY['Project Management']),
  ('salesforce', ARRAY['Salesforce', 'SFDC']), ('figma', ARRAY['Figma']),
  ('user-research', ARRAY['User Research', 'UX Research']),
  ('cybersecurity', ARRAY['Cybersecurity', 'Cyber Security', 'Information Security'])
) AS seed(slug, aliases)
JOIN public.knowledge_skills skill USING (slug)
CROSS JOIN LATERAL unnest(seed.aliases) AS aliases(alias);

INSERT INTO public.knowledge_titles (slug, canonical_title, family) VALUES
  ('software-engineer', 'Software Engineer', 'software-engineering'),
  ('frontend-engineer', 'Frontend Engineer', 'software-engineering'),
  ('backend-engineer', 'Backend Engineer', 'software-engineering'),
  ('full-stack-engineer', 'Full Stack Engineer', 'software-engineering'),
  ('devops-engineer', 'DevOps Engineer', 'infrastructure'),
  ('site-reliability-engineer', 'Site Reliability Engineer', 'infrastructure'),
  ('data-engineer', 'Data Engineer', 'data'),
  ('data-analyst', 'Data Analyst', 'data'),
  ('data-scientist', 'Data Scientist', 'data-science'),
  ('machine-learning-engineer', 'Machine Learning Engineer', 'data-science'),
  ('product-manager', 'Product Manager', 'product'),
  ('project-manager', 'Project Manager', 'operations'),
  ('product-designer', 'Product Designer', 'design'),
  ('security-engineer', 'Security Engineer', 'security'),
  ('salesforce-administrator', 'Salesforce Administrator', 'business-systems');

INSERT INTO public.knowledge_title_aliases (title_id, alias)
SELECT title.id, aliases.alias
FROM (VALUES
  ('software-engineer', ARRAY['Software Engineer', 'Software Developer', 'Application Developer']),
  ('frontend-engineer', ARRAY['Frontend Engineer', 'Front End Engineer', 'Frontend Developer', 'UI Engineer']),
  ('backend-engineer', ARRAY['Backend Engineer', 'Back End Engineer', 'Backend Developer']),
  ('full-stack-engineer', ARRAY['Full Stack Engineer', 'Full Stack Developer']),
  ('devops-engineer', ARRAY['DevOps Engineer', 'Platform Engineer', 'Cloud Engineer']),
  ('site-reliability-engineer', ARRAY['Site Reliability Engineer', 'SRE']),
  ('data-engineer', ARRAY['Data Engineer', 'Analytics Engineer']),
  ('data-analyst', ARRAY['Data Analyst', 'Business Intelligence Analyst', 'BI Analyst']),
  ('data-scientist', ARRAY['Data Scientist', 'Applied Scientist']),
  ('machine-learning-engineer', ARRAY['Machine Learning Engineer', 'ML Engineer']),
  ('product-manager', ARRAY['Product Manager', 'Technical Product Manager']),
  ('project-manager', ARRAY['Project Manager', 'Program Manager']),
  ('product-designer', ARRAY['Product Designer', 'UX Designer', 'UI UX Designer']),
  ('security-engineer', ARRAY['Security Engineer', 'Cybersecurity Engineer', 'Information Security Engineer']),
  ('salesforce-administrator', ARRAY['Salesforce Administrator', 'Salesforce Admin'])
) AS seed(slug, aliases)
JOIN public.knowledge_titles title USING (slug)
CROSS JOIN LATERAL unnest(seed.aliases) AS aliases(alias);

INSERT INTO public.knowledge_title_skills (title_id, skill_id, weight)
SELECT title.id, skill.id, edge.weight
FROM (VALUES
  ('frontend-engineer', 'javascript', 95), ('frontend-engineer', 'typescript', 85),
  ('frontend-engineer', 'react', 90), ('frontend-engineer', 'next-js', 70),
  ('backend-engineer', 'node-js', 70), ('backend-engineer', 'java', 70),
  ('backend-engineer', 'python', 65), ('backend-engineer', 'sql', 70),
  ('full-stack-engineer', 'javascript', 90), ('full-stack-engineer', 'typescript', 80),
  ('full-stack-engineer', 'react', 80), ('full-stack-engineer', 'sql', 65),
  ('devops-engineer', 'aws', 80), ('devops-engineer', 'docker', 90),
  ('devops-engineer', 'kubernetes', 85), ('devops-engineer', 'terraform', 85),
  ('site-reliability-engineer', 'kubernetes', 85), ('site-reliability-engineer', 'terraform', 75),
  ('data-engineer', 'sql', 95), ('data-engineer', 'python', 80),
  ('data-analyst', 'sql', 90), ('data-analyst', 'data-analysis', 95),
  ('data-analyst', 'tableau', 65), ('data-analyst', 'power-bi', 65),
  ('data-scientist', 'python', 90), ('data-scientist', 'machine-learning', 85),
  ('machine-learning-engineer', 'python', 90), ('machine-learning-engineer', 'machine-learning', 95),
  ('product-manager', 'product-management', 95),
  ('project-manager', 'project-management', 95),
  ('product-designer', 'figma', 85), ('product-designer', 'user-research', 75),
  ('security-engineer', 'cybersecurity', 95),
  ('salesforce-administrator', 'salesforce', 95)
) AS edge(title_slug, skill_slug, weight)
JOIN public.knowledge_titles title ON title.slug = edge.title_slug
JOIN public.knowledge_skills skill ON skill.slug = edge.skill_slug;

CREATE OR REPLACE FUNCTION public.enqueue_job_knowledge_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.job_knowledge_enrichment_queue (job_id, queued_at)
  VALUES (NEW.id, now())
  ON CONFLICT (job_id) DO UPDATE SET queued_at = EXCLUDED.queued_at;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enqueue_job_knowledge_enrichment
AFTER INSERT OR UPDATE OF title, skills ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.enqueue_job_knowledge_enrichment();

CREATE OR REPLACE FUNCTION public.process_job_knowledge_queue(p_limit INTEGER DEFAULT 500)
RETURNS TABLE (processed_jobs INTEGER, mapped_titles INTEGER, mapped_skills INTEGER, remaining_jobs BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bounded_limit INTEGER := LEAST(GREATEST(p_limit, 1), 1000);
BEGIN
  CREATE TEMP TABLE selected_jobs (
    job_id UUID PRIMARY KEY
  ) ON COMMIT DROP;

  INSERT INTO selected_jobs (job_id)
  SELECT queue.job_id
  FROM public.job_knowledge_enrichment_queue queue
  ORDER BY queue.queued_at, queue.job_id
  LIMIT bounded_limit
  FOR UPDATE SKIP LOCKED;

  DELETE FROM public.job_knowledge_titles mapping
  USING selected_jobs selected
  WHERE mapping.job_id = selected.job_id;

  DELETE FROM public.job_knowledge_skills mapping
  USING selected_jobs selected
  WHERE mapping.job_id = selected.job_id;

  INSERT INTO public.job_knowledge_titles (
    job_id, title_id, matched_alias, confidence, updated_at
  )
  SELECT job.id, match.title_id, match.alias,
    CASE WHEN public.normalize_knowledge_term(job.title) = match.normalized_alias
      THEN 100 ELSE 80 END,
    now()
  FROM selected_jobs selected
  JOIN public.jobs job ON job.id = selected.job_id
  CROSS JOIN LATERAL (
    SELECT alias.title_id, alias.alias, alias.normalized_alias
    FROM public.knowledge_title_aliases alias
    WHERE position(
      ' ' || alias.normalized_alias || ' '
      IN ' ' || public.normalize_knowledge_term(job.title) || ' '
    ) > 0
    ORDER BY
      (public.normalize_knowledge_term(job.title) = alias.normalized_alias) DESC,
      char_length(alias.normalized_alias) DESC
    LIMIT 1
  ) match;
  GET DIAGNOSTICS mapped_titles = ROW_COUNT;

  INSERT INTO public.job_knowledge_skills (
    job_id, skill_id, matched_alias, updated_at
  )
  SELECT DISTINCT job.id, alias.skill_id, alias.alias, now()
  FROM selected_jobs selected
  JOIN public.jobs job ON job.id = selected.job_id
  CROSS JOIN LATERAL unnest(job.skills) listed_skill
  JOIN public.knowledge_skill_aliases alias
    ON alias.normalized_alias = public.normalize_knowledge_term(listed_skill);
  GET DIAGNOSTICS mapped_skills = ROW_COUNT;

  DELETE FROM public.job_knowledge_enrichment_queue queue
  USING selected_jobs selected
  WHERE queue.job_id = selected.job_id;

  SELECT count(*)::INTEGER INTO processed_jobs FROM selected_jobs;
  SELECT count(*) INTO remaining_jobs FROM public.job_knowledge_enrichment_queue;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_knowledge_term(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_knowledge_term(TEXT) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enqueue_job_knowledge_enrichment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_job_knowledge_queue(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_job_knowledge_queue(INTEGER) TO service_role;

-- Seed the queue once; the bounded processor performs the backfill safely.
INSERT INTO public.job_knowledge_enrichment_queue (job_id)
SELECT id FROM public.jobs
ON CONFLICT (job_id) DO NOTHING;
