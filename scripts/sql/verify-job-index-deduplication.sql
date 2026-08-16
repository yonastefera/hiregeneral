-- Verify the exact duplicate jobs indexes were removed while their retained
-- equivalents remain. Run after 20260815153000_remove_exact_duplicate_job_indexes.sql.

with expected(index_name, expected_present) as (
  values
    ('idx_jobs_category', false),
    ('idx_jobs_slug', false),
    ('idx_jobs_slug_unique', false),
    ('idx_jobs_source_unique', false),
    ('idx_jobs_published_posted_at', false),
    ('jobs_category_idx', true),
    ('jobs_slug_key', true),
    ('jobs_source_name_source_id_key', true),
    ('jobs_published_posted_at_idx', true)
),
actual as (
  select indexname as index_name
  from pg_catalog.pg_indexes
  where schemaname = 'public'
    and tablename = 'jobs'
)
select
  expected.index_name,
  expected.expected_present,
  (actual.index_name is not null) as actual_present,
  expected.expected_present = (actual.index_name is not null) as correct
from expected
left join actual using (index_name)
order by expected.expected_present, expected.index_name;
