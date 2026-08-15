-- Read-only diagnostics for the three missing production migration markers.
select
  'assign_initial_role overload' as check_name,
  coalesce(
    string_agg(
      pg_catalog.pg_get_function_identity_arguments(p.oid),
      ' | ' order by pg_catalog.pg_get_function_identity_arguments(p.oid)
    ),
    'missing'
  ) as detail
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'assign_initial_role'

union all

select
  'auth_role_audit_log table',
  coalesce(to_regclass('public.auth_role_audit_log')::text, 'missing')

union all

select
  'job_enrichments table',
  coalesce(to_regclass('public.job_enrichments')::text, 'missing')

union all

select
  'job_enrichments RLS enabled',
  coalesce((
    select c.relrowsecurity::text
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'job_enrichments'
  ), 'table missing')

union all

select
  'job_enrichments policies',
  coalesce(string_agg(policyname, ' | ' order by policyname), 'none')
from pg_catalog.pg_policies
where schemaname = 'public' and tablename = 'job_enrichments'

union all

select
  'anon/authenticated job_enrichments writes',
  case
    when to_regclass('public.job_enrichments') is null then 'table missing'
    else concat_ws(', ',
      'anon insert=' || has_table_privilege('anon', 'public.job_enrichments', 'INSERT'),
      'anon update=' || has_table_privilege('anon', 'public.job_enrichments', 'UPDATE'),
      'anon delete=' || has_table_privilege('anon', 'public.job_enrichments', 'DELETE'),
      'authenticated insert=' || has_table_privilege('authenticated', 'public.job_enrichments', 'INSERT'),
      'authenticated update=' || has_table_privilege('authenticated', 'public.job_enrichments', 'UPDATE'),
      'authenticated delete=' || has_table_privilege('authenticated', 'public.job_enrichments', 'DELETE')
    )
  end;
