-- Private, explainable ranking for a bounded public job candidate set.
CREATE OR REPLACE FUNCTION public.rank_jobs_for_current_profile(
  p_job_ids UUID[]
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH
actor AS (
  SELECT auth.uid() AS user_id
),
requested_jobs AS (
  SELECT job_id, position
  FROM unnest(COALESCE(p_job_ids[1:25], '{}'::UUID[]))
    WITH ORDINALITY AS requested(job_id, position)
),
profile AS (
  SELECT
    profiles.headline,
    profiles.level_of_experience,
    profiles.location,
    profiles.skills
  FROM public.profiles, actor
  WHERE profiles.user_id = actor.user_id
),
profile_skills AS (
  SELECT DISTINCT alias.skill_id
  FROM profile
  CROSS JOIN LATERAL unnest(COALESCE(profile.skills, '{}'::TEXT[])) listed_skill
  JOIN public.knowledge_skill_aliases alias
    ON alias.normalized_alias = public.normalize_knowledge_term(listed_skill)
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
job_evidence AS (
  SELECT
    job.id AS job_id,
    requested_jobs.position,
    count(DISTINCT mapping.skill_id) FILTER (
      WHERE profile_skills.skill_id IS NOT NULL
    )::INTEGER AS matched_skills,
    EXISTS (
      SELECT 1
      FROM public.job_knowledge_titles job_title
      JOIN profile_titles ON profile_titles.title_id = job_title.title_id
      WHERE job_title.job_id = job.id
    ) AS title_match,
    CASE
      WHEN COALESCE(profile.location, '') <> '' AND (
        public.normalize_knowledge_term(job.location) LIKE
          '%' || public.normalize_knowledge_term(profile.location) || '%'
        OR lower(job.location) LIKE '%remote%'
      ) THEN true ELSE false
    END AS location_match,
    CASE
      WHEN COALESCE(profile.level_of_experience, '') <> ''
        AND COALESCE(job.experience_level, '') <> ''
        AND public.normalize_knowledge_term(job.experience_level) LIKE
          '%' || public.normalize_knowledge_term(profile.level_of_experience) || '%'
      THEN true ELSE false
    END AS experience_match
  FROM requested_jobs
  JOIN public.jobs job ON job.id = requested_jobs.job_id
  CROSS JOIN profile
  LEFT JOIN public.job_knowledge_skills mapping ON mapping.job_id = job.id
  LEFT JOIN profile_skills ON profile_skills.skill_id = mapping.skill_id
  WHERE job.status = 'published'
    AND (job.expires_at IS NULL OR job.expires_at > now())
  GROUP BY
    job.id,
    requested_jobs.position,
    profile.location,
    profile.level_of_experience
),
scored AS (
  SELECT
    job_id,
    position,
    LEAST(100,
      CASE WHEN matched_skills > 0 THEN LEAST(55, 20 + matched_skills * 12) ELSE 0 END
      + CASE WHEN title_match THEN 25 ELSE 0 END
      + CASE WHEN location_match THEN 10 ELSE 0 END
      + CASE WHEN experience_match THEN 10 ELSE 0 END
    )::INTEGER AS score,
    to_jsonb(array_remove(ARRAY[
      CASE WHEN matched_skills > 0 THEN
        matched_skills || CASE WHEN matched_skills = 1
          THEN ' canonical skill matches' ELSE ' canonical skills match' END
      END,
      CASE WHEN title_match THEN 'Role title aligns with your profile' END,
      CASE WHEN location_match THEN 'Location preference aligns' END,
      CASE WHEN experience_match THEN 'Experience level aligns' END
    ], NULL)) AS reasons
  FROM job_evidence
)
SELECT COALESCE(
  jsonb_agg(
    jsonb_build_object('jobId', job_id, 'score', score, 'reasons', reasons)
    ORDER BY score DESC, position
  ) FILTER (WHERE score > 0),
  '[]'::JSONB
)
FROM scored;
$$;

REVOKE ALL ON FUNCTION public.rank_jobs_for_current_profile(UUID[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rank_jobs_for_current_profile(UUID[])
  TO authenticated;
