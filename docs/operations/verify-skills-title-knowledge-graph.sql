SELECT
  to_regclass('public.knowledge_skills') IS NOT NULL AS skills_present,
  to_regclass('public.knowledge_titles') IS NOT NULL AS titles_present,
  to_regclass('public.knowledge_title_skills') IS NOT NULL AS title_skill_edges_present,
  to_regclass('public.job_knowledge_skills') IS NOT NULL AS job_skills_present,
  to_regclass('public.job_knowledge_titles') IS NOT NULL AS job_titles_present,
  to_regclass('public.job_knowledge_enrichment_queue') IS NOT NULL AS enrichment_queue_present,
  to_regprocedure('public.process_job_knowledge_queue(integer)') IS NOT NULL
    AS processor_present,
  NOT has_function_privilege(
    'anon', 'public.process_job_knowledge_queue(integer)', 'EXECUTE'
  ) AS anonymous_processor_blocked,
  NOT has_function_privilege(
    'authenticated', 'public.process_job_knowledge_queue(integer)', 'EXECUTE'
  ) AS authenticated_processor_blocked,
  has_function_privilege(
    'service_role', 'public.process_job_knowledge_queue(integer)', 'EXECUTE'
  ) AS service_processor_allowed;

-- Run repeatedly after deployment until remaining_jobs reaches zero.
SELECT * FROM public.process_job_knowledge_queue(1000);
