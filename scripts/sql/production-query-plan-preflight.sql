-- Read-only inputs for launch-critical production query-plan review.
-- Run in production and return the result rows before running EXPLAIN.

with application_functions as (
  select
    proc.oid::regprocedure::text as function_signature,
    pg_catalog.pg_get_functiondef(proc.oid) as function_definition
  from pg_catalog.pg_proc proc
  join pg_catalog.pg_namespace namespace
    on namespace.oid = proc.pronamespace
  where namespace.nspname = 'public'
    and proc.proname in ('search_locations', 'search_jobs')
),
representative_values as (
  select
    (
      select recruiter_id::text
      from public.jobs
      where recruiter_id is not null
      group by recruiter_id
      order by count(*) desc
      limit 1
    ) as recruiter_id,
    (
      select user_id::text
      from public.saved_jobs
      group by user_id
      order by count(*) desc
      limit 1
    ) as saved_jobs_user_id,
    (
      select max(release_year)::text
      from public.salary_benchmarks
      where annual_median is not null
    ) as salary_release_year
)
select
  'representative_values'::text as result_type,
  jsonb_build_object(
    'recruiter_id', representative_values.recruiter_id,
    'saved_jobs_user_id', representative_values.saved_jobs_user_id,
    'salary_release_year', representative_values.salary_release_year
  ) as details
from representative_values

union all

select
  'function_definition'::text as result_type,
  jsonb_build_object(
    'signature', application_functions.function_signature,
    'definition', application_functions.function_definition
  ) as details
from application_functions
order by result_type, details;
