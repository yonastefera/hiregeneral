-- Read-only validation before consolidating public keyword search onto the
-- indexed jobs.search_text column.

with column_metadata as (
  select jsonb_build_object(
    'data_type', data_type,
    'is_generated', is_generated,
    'generation_expression', generation_expression,
    'column_default', column_default
  ) as details
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'jobs'
    and column_name = 'search_text'
),
match_counts as (
  select jsonb_build_object(
    'published_rows', count(*),
    'null_search_text', count(*) filter (where search_text is null),
    'four_field_matches', count(*) filter (
      where title ilike '%software%'
        or company_name ilike '%software%'
        or description ilike '%software%'
        or category ilike '%software%'
    ),
    'search_text_matches', count(*) filter (
      where search_text ilike '%software%'
    ),
    'four_field_only', count(*) filter (
      where (
        title ilike '%software%'
        or company_name ilike '%software%'
        or description ilike '%software%'
        or category ilike '%software%'
      )
      and search_text not ilike '%software%'
    ),
    'search_text_only', count(*) filter (
      where search_text ilike '%software%'
        and not (
          title ilike '%software%'
          or company_name ilike '%software%'
          or description ilike '%software%'
          or category ilike '%software%'
        )
    )
  ) as details
  from public.jobs
  where status = 'published'
)
select 'column_metadata'::text as result_type, details
from column_metadata

union all

select 'match_counts'::text as result_type, details
from match_counts
order by result_type;
