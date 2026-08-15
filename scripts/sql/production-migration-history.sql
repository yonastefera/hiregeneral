-- Read-only migration-history discovery. Run this first because projects whose
-- schema was applied through the SQL Editor may not have Supabase CLI history.
select
  n.nspname as schema_name,
  c.relname as object_name,
  case c.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned table'
    when 'v' then 'view'
    when 'm' then 'materialized view'
    else c.relkind::text
  end as object_type
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where
  n.nspname ilike '%migration%'
  or c.relname ilike '%migration%'
order by n.nspname, c.relname;

-- If the result includes supabase_migrations.schema_migrations, run:
-- select * from supabase_migrations.schema_migrations order by version;
