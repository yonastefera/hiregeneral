-- Read-only ownership and usage diagnostics for overlapping jobs indexes.
select
  idx.relname as index_name,
  pg_size_pretty(pg_relation_size(idx.oid)) as index_size,
  coalesce(stats.idx_scan, 0) as scans,
  info.indisunique as is_unique,
  info.indisprimary as is_primary,
  info.indisvalid as is_valid,
  constraint_info.conname as owned_by_constraint,
  case constraint_info.contype
    when 'p' then 'primary key'
    when 'u' then 'unique'
    when 'x' then 'exclusion'
    else null
  end as constraint_type,
  pg_get_indexdef(idx.oid) as definition
from pg_catalog.pg_class tbl
join pg_catalog.pg_namespace ns on ns.oid = tbl.relnamespace
join pg_catalog.pg_index info on info.indrelid = tbl.oid
join pg_catalog.pg_class idx on idx.oid = info.indexrelid
left join pg_catalog.pg_stat_user_indexes stats
  on stats.indexrelid = idx.oid
left join pg_catalog.pg_constraint constraint_info
  on constraint_info.conindid = idx.oid
 and constraint_info.contype in ('p', 'u', 'x')
where ns.nspname = 'public'
  and tbl.relname = 'jobs'
order by
  coalesce(constraint_info.conname, ''),
  pg_get_indexdef(idx.oid),
  idx.relname;
