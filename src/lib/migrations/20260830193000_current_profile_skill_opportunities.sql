-- Explainable adjacent skills for the authenticated seeker's canonical title.
CREATE OR REPLACE FUNCTION public.current_profile_skill_opportunities()
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH
profile AS (
  SELECT headline, skills
  FROM public.profiles
  WHERE user_id = auth.uid()
),
profile_titles AS (
  SELECT DISTINCT alias.title_id
  FROM profile
  JOIN public.knowledge_title_aliases alias
    ON position(
      ' ' || alias.normalized_alias || ' '
      IN ' ' || public.normalize_knowledge_term(profile.headline) || ' '
    ) > 0
),
profile_skills AS (
  SELECT DISTINCT alias.skill_id
  FROM profile
  CROSS JOIN LATERAL unnest(COALESCE(profile.skills, '{}'::TEXT[])) listed_skill
  JOIN public.knowledge_skill_aliases alias
    ON alias.normalized_alias = public.normalize_knowledge_term(listed_skill)
),
opportunities AS (
  SELECT
    skill.id,
    skill.canonical_name,
    skill.category,
    max(edge.weight)::INTEGER AS weight,
    count(DISTINCT mapping.job_id) FILTER (
      WHERE job.status = 'published'
        AND (job.expires_at IS NULL OR job.expires_at > now())
    )::INTEGER AS active_jobs
  FROM profile_titles
  JOIN public.knowledge_title_skills edge
    ON edge.title_id = profile_titles.title_id
  JOIN public.knowledge_skills skill ON skill.id = edge.skill_id
  LEFT JOIN profile_skills ON profile_skills.skill_id = skill.id
  LEFT JOIN public.job_knowledge_skills mapping ON mapping.skill_id = skill.id
  LEFT JOIN public.jobs job ON job.id = mapping.job_id
  WHERE profile_skills.skill_id IS NULL
  GROUP BY skill.id, skill.canonical_name, skill.category
  ORDER BY active_jobs DESC, weight DESC, skill.canonical_name
  LIMIT 6
)
SELECT COALESCE(
  jsonb_agg(jsonb_build_object(
    'skillId', id,
    'name', canonical_name,
    'category', category,
    'relationshipWeight', weight,
    'activeJobs', active_jobs
  ) ORDER BY active_jobs DESC, weight DESC, canonical_name),
  '[]'::JSONB
)
FROM opportunities;
$$;

REVOKE ALL ON FUNCTION public.current_profile_skill_opportunities()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_profile_skill_opportunities()
  TO authenticated;
