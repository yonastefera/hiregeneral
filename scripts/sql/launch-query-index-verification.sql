-- Read-only verification for 20260815150000_add_launch_query_indexes.sql.
select
  expected.index_name,
  to_regclass('public.' || expected.index_name) is not null as present
from (
  values
    ('idx_jobs_recruiter_created_at'),
    ('idx_jobs_recruiter_status_created_at'),
    ('idx_applications_user_created_at'),
    ('idx_applications_job_created_at'),
    ('idx_conversations_participant_one_activity'),
    ('idx_conversations_participant_two_activity'),
    ('idx_saved_jobs_user_created_at')
) as expected(index_name)
order by expected.index_name;
