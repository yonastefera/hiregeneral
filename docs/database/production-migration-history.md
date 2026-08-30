# Production migration history

Status: **production catalog inspected; no application migration ledger found**

The repository baseline established on 2026-08-15 contains 115 historical SQL
files with aggregate SHA-256
`5be3ecbf3fbd76391da7ecfeead4ed0da8a9bdd003fda1b24984b2fe55341ef6`.
This is repository history only; it is not evidence of remote application.

Run the read-only query at
`scripts/sql/production-migration-history.sql` in the production Supabase SQL
Editor. It first discovers any migration-history relation because SQL
Editor-managed projects may not contain
`supabase_migrations.schema_migrations`. Export or paste the discovery result
below before any migration-history repair, rename, squash, or remote baseline.

| Captured at (UTC) | Production project     | Result                                          |
| ----------------- | ---------------------- | ----------------------------------------------- |
| 2026-08-15        | `svzsorgmgvvmikrwboaq` | No application migration-history relation found |

Observed: querying `supabase_migrations.schema_migrations` directly returned
PostgreSQL error `42P01` (relation does not exist). This suggests CLI migration
history was not initialized at that path. Catalog discovery returned only
Supabase-managed internal histories:

- `auth.schema_migrations`
- `realtime.schema_migrations`
- `storage.migrations`

These relations belong to Supabase services and must not be used, edited, or
repaired as HireGeneral application history. Production therefore has no
discoverable application migration ledger. Applied application history must be
reconciled from the live schema and deployment records before establishing a
new forward-only remote baseline.

The next read-only reconciliation step is
`scripts/sql/production-migration-evidence.sql`. It checks one distinctive
schema object from every named repository migration. A `true` result is useful
evidence that the migration's effect is present, but it does not prove the
entire file executed successfully or establish its application timestamp.

The 2026-08-15 evidence run found 14 of 17 named migration markers. Missing:

- `20260801_atomic_initial_role_assignment.sql`
- `20260801_role_assignment_audit.sql`
- `20260809_job_enrichments_rls.sql`

Before applying anything, run
`scripts/sql/production-migration-gap-diagnostics.sql` to distinguish a missing
function/table from a signature mismatch and to inspect the existing
`job_enrichments` RLS and grants.

The diagnostic confirmed the role-assignment function and audit table were
missing. `job_enrichments` existed with RLS enabled but no policies, while both
browser roles retained write grants. The forward-only remediation is
`20260815143000_restore_role_assignment_and_enrichment_access.sql`; it restores
the service-role-only atomic function and audit table, creates the filtered
public SELECT policy, and revokes browser writes.

Production application and verification completed on 2026-08-15. The verified
post-migration state is:

- `assign_initial_role` has the five expected arguments, including `p_source`.
- `auth_role_audit_log` exists.
- `job_enrichments` has RLS enabled.
- `Public can view published job enrichments` is installed.
- `anon` and `authenticated` have no INSERT, UPDATE, or DELETE table grants on
  `job_enrichments`.

The same migration and diagnostic verification completed successfully against
the dedicated `hiregeneral-test` project. Production and test now match for all
of the remediated role-assignment and job-enrichment controls.

The evidence query now includes every named and forward migration through
`20260829043000_scalable_job_ingestion.sql`.

The production evidence refresh completed on 2026-08-29 after the scalable
ingestion migration was applied. All 35 distinctive migration markers returned
`true`, including the staging table, dead-letter table, and atomic publication
function introduced for Phase 2 ingestion.

| Captured at (UTC) | Production project     | Evidence refresh                   |
| ----------------- | ---------------------- | ---------------------------------- |
| 2026-08-29        | `svzsorgmgvvmikrwboaq` | All 35 distinctive markers present |

Phase 3 introduced the following forward migrations:

- `20260829223000_saved_searches_and_alerts.sql` — applied and verified in the
  test and production projects on 2026-08-29.
- `20260829234500_application_timeline_and_responses.sql` — apply to the test
  project first, verify with
  `docs/operations/verify-user-differentiation.sql`, then apply to production.

Do not mark the second migration as production-applied until its verification
query returns only `true` values.

## Reconciliation checklist

- Match every remote version to an immutable repository migration or document
  why Supabase has no corresponding history row.
- Identify repository migrations applied manually through the SQL Editor.
- Record drift discovered by schema comparison separately from history drift.
- Establish the remote forward-only baseline only after the comparison has been
  reviewed and backed up.
