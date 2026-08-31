-- Apply and benchmark in the dedicated test project first.
-- Production verification must remain read-only and should not use
-- EXPLAIN ANALYZE during normal traffic.

SELECT
  to_regclass('public.jobs_search_text_trgm_idx') IS NOT NULL
    AS trigram_index_present,
  position(
    'job.search_text LIKE ''%'' || parameters.query || ''%''' IN
    pg_get_functiondef(
      'public.search_jobs_knowledge_public(text,integer,text,text,text,text,text,uuid,integer,integer,text)'::regprocedure
    )
  ) > 0 AS indexed_predicate_present,
  has_function_privilege(
    'anon',
    'public.search_jobs_knowledge_public(text,integer,text,text,text,text,text,uuid,integer,integer,text)',
    'EXECUTE'
  ) AS anonymous_can_execute;

-- Functional smoke test. Empty rows are valid when the project has no match.
SELECT public.search_jobs_knowledge_public(
  'engineer', 30, NULL, NULL, NULL, NULL, NULL, NULL, 1, 20, 'company'
) AS sample_search;

-- Test project only: inspect whether PostgreSQL uses the trigram index.
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT id
-- FROM public.jobs
-- WHERE search_text LIKE '%engineer%';
