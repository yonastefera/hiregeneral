-- Aggregate homepage market data inside Postgres. Only a few summary rows cross
-- the API boundary instead of as many as 3,000 complete job-analysis rows.
CREATE OR REPLACE FUNCTION public.get_home_insights_public()
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
WITH
eligible_jobs AS (
  SELECT
    job.id,
    job.category,
    lower(concat_ws(
      ' ',
      job.title,
      job.category,
      array_to_string(job.skills, ' ')
    )) AS searchable_text,
    CASE
      WHEN COALESCE(job.salary_min, job.salary_max) BETWEEN 1 AND 300
        THEN COALESCE(job.salary_min, job.salary_max) * 2080
      WHEN COALESCE(job.salary_min, job.salary_max) BETWEEN 10000 AND 1000000
        THEN COALESCE(job.salary_min, job.salary_max)
      ELSE NULL
    END AS normalized_low,
    CASE
      WHEN COALESCE(job.salary_max, job.salary_min) BETWEEN 1 AND 300
        THEN COALESCE(job.salary_max, job.salary_min) * 2080
      WHEN COALESCE(job.salary_max, job.salary_min) BETWEEN 10000 AND 1000000
        THEN COALESCE(job.salary_max, job.salary_min)
      ELSE NULL
    END AS normalized_high
  FROM public.jobs job
  WHERE job.status = 'published'
    AND (job.expires_at IS NULL OR job.expires_at > now())
  ORDER BY job.posted_at DESC
  LIMIT 3000
),
salary_buckets(role, terms) AS (
  VALUES
    ('Software Engineer', ARRAY[
      'software engineer', 'software developer', 'full stack', 'frontend',
      'front end', 'backend', 'back end', 'application developer'
    ]::TEXT[]),
    ('Data Engineer', ARRAY[
      'data engineer', 'analytics engineer', 'business intelligence'
    ]::TEXT[]),
    ('Product Designer', ARRAY[
      'product designer', 'ux designer', 'ui designer', 'user experience'
    ]::TEXT[]),
    ('Security Engineer', ARRAY[
      'security engineer', 'cybersecurity', 'cyber security', 'security analyst'
    ]::TEXT[]),
    ('Product Manager', ARRAY[
      'product manager', 'technical product', 'product owner'
    ]::TEXT[]),
    ('Cloud Engineer', ARRAY[
      'cloud engineer', 'devops', 'site reliability', 'sre', 'platform engineer'
    ]::TEXT[])
),
salary_matches AS (
  SELECT
    bucket.role,
    LEAST(job.normalized_low, job.normalized_high) AS salary_low,
    GREATEST(job.normalized_low, job.normalized_high) AS salary_high,
    (job.normalized_low + job.normalized_high) / 2.0 AS midpoint
  FROM eligible_jobs job
  CROSS JOIN salary_buckets bucket
  WHERE job.normalized_low IS NOT NULL
    AND job.normalized_high IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM unnest(bucket.terms) term
      WHERE job.searchable_text LIKE '%' || term || '%'
    )
),
salary_stats AS (
  SELECT
    role,
    round(percentile_cont(0.25) WITHIN GROUP (ORDER BY salary_low)) AS low,
    round(percentile_cont(0.75) WITHIN GROUP (ORDER BY salary_high)) AS high,
    count(*)::INTEGER AS sample_count,
    percentile_cont(
      ARRAY[0.0, 0.1667, 0.3333, 0.5, 0.6667, 0.8333, 1.0]
    ) WITHIN GROUP (ORDER BY midpoint) AS spark_values
  FROM salary_matches
  GROUP BY role
),
category_buckets(name, query, icon, terms) AS (
  VALUES
    ('Engineering', 'software engineering', 'engineering', ARRAY[
      'engineer', 'developer', 'software', 'frontend', 'backend', 'full stack',
      'platform', 'devops', 'sre'
    ]::TEXT[]),
    ('Data & AI', 'data ai', 'data', ARRAY[
      'data', 'analytics', 'machine learning', 'artificial intelligence', 'ai',
      'bi', 'scientist'
    ]::TEXT[]),
    ('Design', 'product design', 'design', ARRAY[
      'designer', 'design', 'ux', 'ui', 'user experience', 'creative'
    ]::TEXT[]),
    ('Security', 'security', 'operations', ARRAY[
      'security', 'cyber', 'risk', 'compliance', 'privacy'
    ]::TEXT[]),
    ('Product', 'product manager', 'operations', ARRAY[
      'product', 'program manager', 'project manager', 'scrum', 'agile'
    ]::TEXT[]),
    ('Healthcare Tech', 'healthcare technology', 'healthcare', ARRAY[
      'health', 'clinical', 'medical', 'pharmacy', 'patient', 'healthcare'
    ]::TEXT[]),
    ('Marketing Tech', 'marketing technology', 'marketing', ARRAY[
      'marketing', 'growth', 'crm', 'campaign', 'seo', 'content'
    ]::TEXT[])
),
bucket_categories AS (
  SELECT
    bucket.name,
    bucket.query,
    bucket.icon,
    count(*)::INTEGER AS job_count
  FROM eligible_jobs job
  CROSS JOIN category_buckets bucket
  WHERE EXISTS (
    SELECT 1
    FROM unnest(bucket.terms) term
    WHERE job.searchable_text LIKE '%' || term || '%'
  )
  GROUP BY bucket.name, bucket.query, bucket.icon
),
fallback_categories AS (
  SELECT
    btrim(job.category) AS name,
    btrim(job.category) AS query,
    'operations'::TEXT AS icon,
    count(*)::INTEGER AS job_count
  FROM eligible_jobs job
  WHERE NULLIF(btrim(job.category), '') IS NOT NULL
  GROUP BY btrim(job.category)
),
selected_categories AS (
  SELECT name, query, icon, job_count
  FROM bucket_categories
  WHERE job_count > 0

  UNION ALL

  SELECT name, query, icon, job_count
  FROM fallback_categories
  WHERE NOT EXISTS (SELECT 1 FROM bucket_categories WHERE job_count > 0)
),
top_salaries AS (
  SELECT * FROM salary_stats ORDER BY sample_count DESC, role LIMIT 4
),
top_categories AS (
  SELECT * FROM selected_categories ORDER BY job_count DESC, name LIMIT 6
)
SELECT jsonb_build_object(
  'salaryBands', COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'role', role,
      'low', low,
      'high', high,
      'sampleCount', sample_count,
      'sparkValues', spark_values
    ) ORDER BY sample_count DESC, role) FROM top_salaries),
    '[]'::JSONB
  ),
  'marketCategories', COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'name', name,
      'query', query,
      'icon', icon,
      'jobCount', job_count
    ) ORDER BY job_count DESC, name) FROM top_categories),
    '[]'::JSONB
  )
);
$$;

REVOKE ALL ON FUNCTION public.get_home_insights_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_home_insights_public()
TO anon, authenticated, service_role;
