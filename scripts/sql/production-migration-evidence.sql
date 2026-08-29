-- Read-only evidence for HireGeneral's named application migrations.
-- This does not prove when or how a migration ran; it only compares distinctive
-- live-schema objects with the repository history.
select *
from (
  values
    ('20260513_add_resume_metadata_to_profiles.sql', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'resume_scan_status')),
    ('20260513_create_locations_table.sql', to_regclass('public.locations') is not null),
    ('20260513_create_schools_table.sql', to_regclass('public.schools') is not null),
    ('20260513_add_school_popularity_rank.sql', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'schools' and column_name = 'popularity_rank')),
    ('20260801_atomic_initial_role_assignment.sql', exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'assign_initial_role')),
    ('20260801_role_assignment_audit.sql', to_regclass('public.auth_role_audit_log') is not null),
    ('20260802_rls_authorization_hardening.sql', exists (select 1 from pg_catalog.pg_trigger where tgname = 'protect_application_update' and not tgisinternal)),
    ('20260802_rls_authorization_followup.sql', exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'saved_jobs' and policyname = 'Job seekers can save published jobs')),
    ('20260802_storage_ownership_hardening.sql', exists (select 1 from pg_catalog.pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can upload their own avatars')),
    ('20260802_security_audit_and_stripe_idempotency.sql', to_regclass('public.security_audit_log') is not null),
    ('20260802_stripe_lifecycle_ordering.sql', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'companies' and column_name = 'billing_last_event_created')),
    ('20260802_employer_entitlement_enforcement.sql', exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'current_employer_entitlements')),
    ('20260802_data_retention.sql', exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'prune_stale_operational_data')),
    ('20260809_job_enrichments_rls.sql', exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'job_enrichments' and policyname = 'Public can view published job enrichments')),
    ('20260814_application_submission_fields.sql', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'applications' and column_name = 'applicant_full_name')),
    ('20260814_job_applicant_counts_view.sql', to_regclass('public.job_applicant_counts') is not null),
    ('20260814_profile_schema_parity.sql', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'work_experience')),
    ('20260815143000_restore_role_assignment_and_enrichment_access.sql', to_regclass('public.auth_role_audit_log') is not null and exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'job_enrichments' and policyname = 'Public can view published job enrichments')),
    ('20260815150000_add_launch_query_indexes.sql', to_regclass('public.idx_jobs_recruiter_created_at') is not null and to_regclass('public.idx_applications_user_created_at') is not null),
    ('20260815153000_remove_exact_duplicate_job_indexes.sql', to_regclass('public.idx_jobs_category') is null and to_regclass('public.idx_jobs_slug') is null and to_regclass('public.idx_jobs_source_unique') is null),
    ('20260815154500_restore_canonical_job_indexes.sql', to_regclass('public.jobs_category_idx') is not null and to_regclass('public.jobs_published_posted_at_idx') is not null),
    ('20260815160000_canonicalize_job_search_text.sql', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'jobs' and column_name = 'search_text') and to_regclass('public.jobs_search_text_trgm_idx') is not null),
    ('20260815163000_optimize_location_autocomplete.sql', to_regclass('public.locations_city_lower_trgm_idx') is not null and exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'search_locations')),
    ('20260815211000_account_deletion_grace_period.sql', to_regclass('public.profiles_pending_deletion_idx') is not null and exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'enforce_account_deletion_grace_period')),
    ('20260815213000_retention_eligibility_report.sql', exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'retention_eligibility_report')),
    ('20260815214500_restrict_retention_report_permissions.sql', not has_function_privilege('anon', 'public.retention_eligibility_report()', 'EXECUTE') and not has_function_privilege('authenticated', 'public.retention_eligibility_report()', 'EXECUTE')),
    ('20260815221500_account_deletion_execution.sql', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'deletion_completed_at') and exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'complete_account_deletion')),
    ('20260816053000_separate_profile_demographics.sql', to_regclass('public.profile_demographics') is not null),
    ('20260816060000_drop_profile_demographic_columns.sql', not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name in ('gender', 'ethnicity', 'veteran_status', 'disability_status'))),
    ('20260816063000_restore_profile_demographics_table.sql', to_regclass('public.profile_demographics') is not null and exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'profile_demographics' and policyname = 'Users can view own demographics')),
    ('20260816070000_restrict_recruiter_profile_access.sql', exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Owners and admins can view profiles')),
    ('20260816073000_employer_access_consent.sql', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'employer_access_consent_at') and to_regclass('public.profiles_employer_discovery_idx') is not null),
    ('20260816080000_hiring_companies_rpc.sql', exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'get_hiring_companies_this_week')),
    ('20260816210000_legal_policy_acceptance.sql', to_regclass('public.legal_policy_acceptances') is not null)
) as evidence(migration_name, distinctive_object_present)
order by migration_name;
