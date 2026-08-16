-- Canonicalize the production hiring-companies RPC so test, local, and future
-- environments match production. Only trusted server code calls this function.

CREATE OR REPLACE FUNCTION public.get_hiring_companies_this_week(
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE(
  company_name TEXT,
  company_logo_url TEXT,
  company_size TEXT,
  company_website TEXT,
  industry TEXT,
  roles BIGINT,
  new_roles BIGINT,
  has_remote BOOLEAN
)
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  WITH normalized_input AS (
    SELECT
      LEAST(GREATEST(COALESCE(p_limit, 6), 1), 12) AS safe_limit,
      now() AS current_time,
      now() - interval '7 days' AS week_start
  ),
  published_jobs AS (
    SELECT
      NULLIF(trim(j.company_name), '') AS company_name,
      NULLIF(trim(j.company_logo_url), '') AS company_logo_url,
      NULLIF(trim(j.company_size), '') AS company_size,
      NULLIF(trim(j.company_website), '') AS company_website,
      NULLIF(trim(j.category), '') AS category,
      NULLIF(trim(j.work_mode), '') AS work_mode,
      j.posted_at
    FROM public.jobs j
    CROSS JOIN normalized_input ni
    WHERE
      j.status = 'published'
      AND NULLIF(trim(j.company_name), '') IS NOT NULL
      AND (j.expires_at IS NULL OR j.expires_at > ni.current_time)
  ),
  company_counts AS (
    SELECT
      pj.company_name,
      count(*)::BIGINT AS roles,
      count(*) FILTER (WHERE pj.posted_at >= ni.week_start)::BIGINT AS new_roles,
      bool_or(lower(COALESCE(pj.work_mode, '')) LIKE '%remote%') AS has_remote
    FROM published_jobs pj
    CROSS JOIN normalized_input ni
    GROUP BY pj.company_name
  ),
  company_categories AS (
    SELECT DISTINCT ON (pj.company_name)
      pj.company_name,
      pj.category AS industry
    FROM published_jobs pj
    WHERE pj.category IS NOT NULL
    GROUP BY pj.company_name, pj.category
    ORDER BY pj.company_name, count(*) DESC, pj.category ASC
  ),
  company_sizes AS (
    SELECT DISTINCT ON (pj.company_name)
      pj.company_name,
      pj.company_size
    FROM published_jobs pj
    WHERE pj.company_size IS NOT NULL
    GROUP BY pj.company_name, pj.company_size
    ORDER BY pj.company_name, count(*) DESC, pj.company_size ASC
  ),
  company_logos AS (
    SELECT DISTINCT ON (pj.company_name)
      pj.company_name,
      pj.company_logo_url
    FROM published_jobs pj
    WHERE pj.company_logo_url IS NOT NULL
    GROUP BY pj.company_name, pj.company_logo_url
    ORDER BY pj.company_name, count(*) DESC, pj.company_logo_url ASC
  ),
  company_websites AS (
    SELECT DISTINCT ON (pj.company_name)
      pj.company_name,
      pj.company_website
    FROM published_jobs pj
    WHERE pj.company_website IS NOT NULL
    GROUP BY pj.company_name, pj.company_website
    ORDER BY pj.company_name, count(*) DESC, pj.company_website ASC
  )
  SELECT
    cc.company_name,
    cl.company_logo_url,
    cs.company_size,
    cw.company_website,
    COALESCE(cat.industry, 'Hiring') AS industry,
    cc.roles,
    cc.new_roles,
    cc.has_remote
  FROM company_counts cc
  LEFT JOIN company_categories cat ON cat.company_name = cc.company_name
  LEFT JOIN company_sizes cs ON cs.company_name = cc.company_name
  LEFT JOIN company_logos cl ON cl.company_name = cc.company_name
  LEFT JOIN company_websites cw ON cw.company_name = cc.company_name
  ORDER BY cc.new_roles DESC, cc.roles DESC, cc.company_name ASC
  LIMIT (SELECT safe_limit FROM normalized_input);
$function$;

REVOKE ALL ON FUNCTION public.get_hiring_companies_this_week(INTEGER)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_hiring_companies_this_week(INTEGER)
TO service_role;
