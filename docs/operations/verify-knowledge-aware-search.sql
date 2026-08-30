SELECT
  to_regprocedure(
    'public.search_jobs_knowledge_public(text,integer,text,text,text,text,text,uuid,integer,integer,text)'
  ) IS NOT NULL AS knowledge_search_present,
  has_function_privilege(
    'anon',
    'public.search_jobs_knowledge_public(text,integer,text,text,text,text,text,uuid,integer,integer,text)',
    'EXECUTE'
  ) AS anonymous_search_allowed,
  has_function_privilege(
    'authenticated',
    'public.search_jobs_knowledge_public(text,integer,text,text,text,text,text,uuid,integer,integer,text)',
    'EXECUTE'
  ) AS authenticated_search_allowed,
  NOT EXISTS (
    SELECT 1
    FROM pg_proc proc
    JOIN pg_namespace namespace ON namespace.oid = proc.pronamespace
    CROSS JOIN LATERAL aclexplode(
      COALESCE(proc.proacl, acldefault('f', proc.proowner))
    ) privilege
    WHERE namespace.nspname = 'public'
      AND proc.proname = 'search_jobs_knowledge_public'
      AND pg_get_function_identity_arguments(proc.oid) =
        'p_query text, p_days_ago integer, p_location text, p_work_mode text, p_employment_type text, p_category text, p_company text, p_exclude_id uuid, p_page integer, p_page_size integer, p_balance text'
      AND privilege.grantee = 0
      AND privilege.privilege_type = 'EXECUTE'
  ) AS public_grant_removed;

SELECT public.search_jobs_knowledge_public(
  'SRE', 3650, NULL, NULL, NULL, NULL, NULL, NULL, 1, 5, 'none'
) AS sample_search;
