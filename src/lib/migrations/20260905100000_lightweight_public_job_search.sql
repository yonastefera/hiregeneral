-- Return only fields required by public job cards. Filtering, company
-- balancing, and pagination happen before rows leave Postgres so broad browse
-- and Easy Apply requests cannot transfer full job records.
CREATE INDEX IF NOT EXISTS jobs_easy_apply_published_posted_idx
ON public.jobs (posted_at DESC, id)
WHERE status = 'published'
  AND (apply_url IS NULL OR btrim(apply_url) = '');

CREATE OR REPLACE FUNCTION public.search_job_cards_public(
  p_query TEXT DEFAULT NULL,
  p_days_ago INTEGER DEFAULT 30,
  p_location TEXT DEFAULT NULL,
  p_work_mode TEXT DEFAULT NULL,
  p_employment_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_exclude_id UUID DEFAULT NULL,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_balance TEXT DEFAULT 'company',
  p_easy_apply BOOLEAN DEFAULT false
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
  WHERE parameters.query <> ''
    AND (
      parameters.query = alias.normalized_alias
      OR position(
        ' ' || alias.normalized_alias || ' ' IN ' ' || parameters.query || ' '
      ) > 0
    )
),
matched_skills AS (
  SELECT DISTINCT alias.skill_id
  FROM public.knowledge_skill_aliases alias, parameters
  WHERE parameters.query <> ''
    AND (
      parameters.query = alias.normalized_alias
      OR position(
        ' ' || alias.normalized_alias || ' ' IN ' ' || parameters.query || ' '
      ) > 0
    )
),
candidate_evidence AS (
  SELECT job.id AS job_id, 100 AS score
  FROM public.jobs job, parameters
  WHERE parameters.query <> ''
    AND job.search_text LIKE '%' || parameters.query || '%'

  UNION ALL

  SELECT mapping.job_id, 85
  FROM public.job_knowledge_titles mapping
  JOIN matched_titles ON matched_titles.title_id = mapping.title_id

  UNION ALL

  SELECT mapping.job_id, 75
  FROM public.job_knowledge_skills mapping
  JOIN matched_skills ON matched_skills.skill_id = mapping.skill_id

  UNION ALL

  SELECT mapping.job_id, 45
  FROM matched_skills
  JOIN public.knowledge_title_skills edge
    ON edge.skill_id = matched_skills.skill_id AND edge.weight >= 70
  JOIN public.job_knowledge_titles mapping ON mapping.title_id = edge.title_id
),
candidate_scores AS (
  SELECT job_id, max(score)::INTEGER AS semantic_score
  FROM candidate_evidence
  GROUP BY job_id
),
filtered AS (
  SELECT
    job.*,
    COALESCE(score.semantic_score, 0) AS semantic_score,
    row_number() OVER (
      PARTITION BY COALESCE(job.company_id::TEXT, lower(job.company_name))
      ORDER BY COALESCE(score.semantic_score, 0) DESC, job.posted_at DESC, job.id
    ) AS company_rank
  FROM public.jobs job
  CROSS JOIN parameters
  LEFT JOIN candidate_scores score ON score.job_id = job.id
  WHERE job.status = 'published'
    AND (job.expires_at IS NULL OR job.expires_at > now())
    AND job.posted_at >= now() - make_interval(days => parameters.days_ago)
    AND (parameters.query = '' OR score.job_id IS NOT NULL)
    AND (p_location IS NULL OR job.location ILIKE '%' || p_location || '%')
    AND (p_work_mode IS NULL OR job.work_mode = p_work_mode)
    AND (p_employment_type IS NULL OR job.employment_type = p_employment_type)
    AND (p_category IS NULL OR job.category = p_category)
    AND (p_company IS NULL OR job.company_name ILIKE '%' || p_company || '%')
    AND (p_exclude_id IS NULL OR job.id <> p_exclude_id)
    AND (
      NOT COALESCE(p_easy_apply, false)
      OR job.apply_url IS NULL
      OR btrim(job.apply_url) = ''
    )
),
balanced AS (
  SELECT *
  FROM filtered
  WHERE p_balance <> 'company' OR company_rank <= 3
),
ranked AS (
  SELECT
    balanced.*,
    row_number() OVER (
      ORDER BY semantic_score DESC, posted_at DESC, id
    ) AS retrieval_rank
  FROM balanced
),
totals AS (
  SELECT
    count(*) AS total,
    count(*) FILTER (WHERE posted_at >= now() - interval '7 days') AS new_jobs
  FROM balanced
),
page_rows AS (
  SELECT
    jsonb_build_object(
      'id', ranked.id,
      'company_name', ranked.company_name,
      'company_logo_url', ranked.company_logo_url,
      'company_tagline', ranked.company_tagline,
      'company_size', ranked.company_size,
      'company_website', ranked.company_website,
      'title', ranked.title,
      'description', left(
        regexp_replace(COALESCE(ranked.description, ''), '<[^>]+>', ' ', 'g'),
        480
      ),
      'location', ranked.location,
      'employment_type', ranked.employment_type,
      'work_mode', ranked.work_mode,
      'experience_level', ranked.experience_level,
      'category', ranked.category,
      'salary_min', ranked.salary_min,
      'salary_max', ranked.salary_max,
      'salary_currency', ranked.salary_currency,
      'skills', COALESCE(to_jsonb(ranked.skills), '[]'::JSONB),
      'slug', ranked.slug,
      'source_name', ranked.source_name,
      'apply_url', ranked.apply_url,
      'posted_at', ranked.posted_at,
      'applicant_count', COALESCE(counts.applicant_count, 0),
      'enrichment', CASE
        WHEN enrichment.job_id IS NULL THEN NULL
        ELSE jsonb_build_object(
          'job_id', enrichment.job_id,
          'display_title', enrichment.display_title,
          'display_location', enrichment.display_location,
          'summary', left(COALESCE(enrichment.summary, ''), 480)
        )
      END
    ) AS row_data,
    ranked.semantic_score,
    ranked.posted_at,
    ranked.id
  FROM ranked
  CROSS JOIN parameters
  LEFT JOIN public.job_applicant_counts counts ON counts.job_id = ranked.id
  LEFT JOIN public.job_enrichments enrichment
    ON enrichment.job_id = ranked.id AND enrichment.status = 'ready'
  WHERE ranked.retrieval_rank > (parameters.page - 1) * parameters.page_size
    AND ranked.retrieval_rank <= parameters.page * parameters.page_size
)
SELECT jsonb_build_object(
  'rows', COALESCE(
    (SELECT jsonb_agg(row_data ORDER BY semantic_score DESC, posted_at DESC, id)
     FROM page_rows),
    '[]'::JSONB
  ),
  'total', totals.total,
  'newJobs', totals.new_jobs
)
FROM totals;
$$;

REVOKE ALL ON FUNCTION public.search_job_cards_public(
  TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, TEXT, BOOLEAN
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_job_cards_public(
  TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, TEXT, BOOLEAN
) TO anon, authenticated;
