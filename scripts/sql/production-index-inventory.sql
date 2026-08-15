-- Read-only index and table-statistics inventory for launch-critical queries.
-- Statistics are cumulative and may reset after maintenance or a database restart.
with targets(table_name) as (
  values
    ('jobs'),
    ('job_sources'),
    ('applications'),
    ('messages'),
    ('conversations'),
    ('profiles'),
    ('salary_benchmarks'),
    ('salary_bls_oews'),
    ('locations'),
    ('saved_jobs')
),
index_details as (
  select
    i.tablename as table_name,
    jsonb_agg(
      jsonb_build_object(
        'name', i.indexname,
        'definition', i.indexdef,
        'size', pg_size_pretty(pg_relation_size((quote_ident(i.schemaname) || '.' || quote_ident(i.indexname))::regclass)),
        'scans', coalesce(s.idx_scan, 0)
      )
      order by i.indexname
    ) as indexes
  from pg_catalog.pg_indexes i
  left join pg_catalog.pg_stat_user_indexes s
    on s.schemaname = i.schemaname
    and s.relname = i.tablename
    and s.indexrelname = i.indexname
  where i.schemaname = 'public'
    and i.tablename in (select table_name from targets)
  group by i.tablename
)
select
  t.table_name,
  to_regclass('public.' || t.table_name) is not null as table_present,
  case
    when c.oid is null then null
    else pg_size_pretty(pg_total_relation_size(c.oid))
  end as total_size,
  coalesce(st.n_live_tup, 0) as estimated_rows,
  coalesce(st.n_dead_tup, 0) as dead_rows,
  coalesce(st.seq_scan, 0) as sequential_scans,
  coalesce(st.idx_scan, 0) as index_scans,
  st.last_analyze,
  st.last_autoanalyze,
  coalesce(d.indexes, '[]'::jsonb) as indexes
from targets t
left join pg_catalog.pg_class c
  on c.oid = to_regclass('public.' || t.table_name)
left join pg_catalog.pg_stat_user_tables st
  on st.schemaname = 'public' and st.relname = t.table_name
left join index_details d on d.table_name = t.table_name
order by t.table_name;
