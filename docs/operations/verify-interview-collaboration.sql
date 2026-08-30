-- Read-only Phase 4.2 verification. Every returned value should be true.
SELECT
  to_regclass('public.employer_team_members') IS NOT NULL
    AS employer_team_present,
  to_regclass('public.interview_scorecards') IS NOT NULL
    AS interview_scorecards_present,
  to_regprocedure('public.is_company_team_member(uuid,uuid)') IS NOT NULL
    AS team_membership_function_present,
  to_regprocedure('public.can_manage_company_team(uuid,uuid)') IS NOT NULL
    AS team_management_function_present,
  to_regprocedure(
    'public.can_access_employer_application(uuid,uuid)'
  ) IS NOT NULL AS application_access_function_present,
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'ensure_company_owner_membership'
      AND NOT tgisinternal
  ) AS owner_membership_trigger_present,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'interview_scorecards'
      AND policyname = 'Company teammates can view interview scorecards'
  ) AS scorecard_team_policy_present,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Applicants and company team can view applications'
  ) AS team_application_policy_present;
