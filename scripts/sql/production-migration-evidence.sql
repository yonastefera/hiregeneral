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
    ('20260814_profile_schema_parity.sql', exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'work_experience'))
) as evidence(migration_name, distinctive_object_present)
order by migration_name;
