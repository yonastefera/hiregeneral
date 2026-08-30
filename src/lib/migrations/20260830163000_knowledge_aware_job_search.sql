-- Ranked public retrieval using lexical evidence plus reviewed graph relations.
CREATE OR REPLACE FUNCTION public.search_jobs_knowledge_public(
  p_query TEXT,
  p_days_ago INTEGER DEFAULT 30,
  p_location TEXT DEFAULT NULL,
  p_work_mode TEXT DEFAULT NULL,
  p_employment_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_exclude_id UUID DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_balance TEXT DEFAULT 'company'
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH
parameters AS (
  SELECT
    public.normalize_knowledge_term(left(COALESCE(p_query, ''), 160)) AS query,
    LEAST(GREATEST(COALESCE(p_days_ago, 30), 1), 3650) AS days_ago,
    LEAST(GREATEST(COALESCE(p_page, 1), 1), 10000) AS page,
    LEAST(GREATEST(COALESCE(p_page_size, 20), 1), 25) AS page_size
),
matched_titles AS (
  SELECT DISTINCT alias.title_id
  FROM public.knowledge_title_aliases alias, parameters
  WHERE parameters.query = alias.normalized_alias
    OR position(
      ' ' || alias.normalized_alias || ' ' IN ' ' || parameters.query || ' '
    ) > 0
),
matched_skills AS (
  SELECT DISTINCT alias.skill_id
  FROM public.knowledge_skill_aliases alias, parameters
  WHERE parameters.query = alias.normalized_alias
    OR position(
      ' ' || alias.normalized_alias || ' ' IN ' ' || parameters.query || ' '
    ) > 0
),
candidate_evidence AS (
  SELECT job.id AS job_id, 100 AS score, 'Exact keyword evidence' AS reason
  FROM public.jobs job, parameters
  WHERE parameters.query <> '' AND position(parameters.query IN job.search_text) > 0

  UNION ALL

  SELECT mapping.job_id, 85, 'Related job title'
  FROM public.job_knowledge_titles mapping
  JOIN matched_titles ON matched_titles.title_id = mapping.title_id

  UNION ALL

  SELECT mapping.job_id, 75, 'Matched skill alias'
  FROM public.job_knowledge_skills mapping
  JOIN matched_skills ON matched_skills.skill_id = mapping.skill_id

  UNION ALL

  SELECT mapping.job_id, 45, 'Related role skill'
  FROM matched_skills
  JOIN public.knowledge_title_skills edge
    ON edge.skill_id = matched_skills.skill_id AND edge.weight >= 70
  JOIN public.job_knowledge_titles mapping ON mapping.title_id = edge.title_id
),
candidate_scores AS (
  SELECT
    job_id,
    max(score)::INTEGER AS semantic_score,
    jsonb_agg(DISTINCT reason ORDER BY reason) AS semantic_reasons
  FROM candidate_evidence
  GROUP BY job_id
),
filtered AS (
  SELECT
    job.*,
    score.semantic_score,
    score.semantic_reasons,
    row_number() OVER (
      PARTITION BY COALESCE(job.company_id::TEXT, lower(job.company_name))
      ORDER BY score.semantic_score DESC, job.posted_at DESC, job.id
    ) AS company_rank
  FROM candidate_scores score
  JOIN public.jobs job ON job.id = score.job_id
  CROSS JOIN parameters
  WHERE job.status = 'published'
    AND (job.expires_at IS NULL OR job.expires_at > now())
    AND job.posted_at >= now() - make_interval(days => parameters.days_ago)
    AND (p_location IS NULL OR job.location ILIKE '%' || p_location || '%')
    AND (p_work_mode IS NULL OR job.work_mode = p_work_mode)
    AND (p_employment_type IS NULL OR job.employment_type = p_employment_type)
    AND (p_category IS NULL OR job.category = p_category)
    AND (p_company IS NULL OR job.company_name ILIKE '%' || p_company || '%')
    AND (p_exclude_id IS NULL OR job.id <> p_exclude_id)
),
balanced AS (
  SELECT *
  FROM filtered
  WHERE p_balance <> 'company' OR company_rank <= 3
),
ranked_results AS (
  SELECT
    balanced.*,
    row_number() OVER (
      ORDER BY semantic_score DESC, posted_at DESC, id
    ) AS retrieval_rank
  FROM balanced
),
page_rows AS (
  SELECT
    (to_jsonb(ranked_results) - 'search_text' - 'company_rank' - 'retrieval_rank') ||
      jsonb_build_object(
        'applicant_count', 0,
        'total_count', (SELECT count(*) FROM balanced),
        'new_jobs_count', (
          SELECT count(*) FROM balanced
          WHERE posted_at >= now() - interval '7 days'
        )
      ) AS row_data,
    semantic_score,
    posted_at,
    id
  FROM ranked_results, parameters
  WHERE retrieval_rank > (parameters.page - 1) * parameters.page_size
    AND retrieval_rank <= parameters.page * parameters.page_size
)
SELECT jsonb_build_object(
  'rows', COALESCE(
    (SELECT jsonb_agg(row_data ORDER BY semantic_score DESC, posted_at DESC, id)
     FROM page_rows),
    '[]'::JSONB
  ),
  'total', (SELECT count(*) FROM balanced),
  'newJobs', (
    SELECT count(*) FROM balanced
    WHERE posted_at >= now() - interval '7 days'
  )
);
$$;

REVOKE ALL ON FUNCTION public.search_jobs_knowledge_public(
  TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_jobs_knowledge_public(
  TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, TEXT
) TO anon, authenticated;
