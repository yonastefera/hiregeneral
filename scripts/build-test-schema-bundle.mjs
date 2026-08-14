import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const migrationDirectory = resolve("src/lib/migrations");
const outputPath =
  process.env.HIREGENERAL_TEST_SCHEMA_OUTPUT ??
  "/private/tmp/hiregeneral-test-schema.sql";

const entries = await readdir(migrationDirectory, { withFileTypes: true });
const legacy = entries
  .map((entry) => entry.name)
  .filter((name) => /^file\d+\.sql$/.test(name))
  .sort((left, right) => {
    const leftNumber = Number(left.match(/\d+/)?.[0]);
    const rightNumber = Number(right.match(/\d+/)?.[0]);
    return leftNumber - rightNumber;
  });

const dated = [
  "20260513_add_resume_metadata_to_profiles.sql",
  "20260513_create_locations_table.sql",
  "20260513_create_schools_table.sql",
  "supabase/migrations/20260513_add_school_popularity_rank.sql",
  "20260801_atomic_initial_role_assignment.sql",
  "20260801_role_assignment_audit.sql",
  "20260802_rls_authorization_hardening.sql",
  "20260802_rls_authorization_followup.sql",
  "20260802_storage_ownership_hardening.sql",
  "20260802_security_audit_and_stripe_idempotency.sql",
  "20260802_stripe_lifecycle_ordering.sql",
  "20260802_employer_entitlement_enforcement.sql",
  "20260802_data_retention.sql",
  "20260809_job_enrichments_rls.sql",
  "20260814_application_submission_fields.sql",
  "20260814_job_applicant_counts_view.sql",
];

if (legacy.length !== 98) {
  throw new Error(`Expected 98 legacy migrations, found ${legacy.length}.`);
}

const files = [...legacy, ...dated];
const sections = [];

for (const file of files) {
  const sql = await readFile(resolve(migrationDirectory, file), "utf8");
  sections.push(
    `\n-- BEGIN MIGRATION: ${file}\n${sql.trim()}\n-- END MIGRATION: ${file}\n`,
  );
}

const verification = `
SELECT
  to_regclass('public.profiles') IS NOT NULL AS profiles_present,
  to_regclass('public.jobs') IS NOT NULL AS jobs_present,
  to_regclass('public.applications') IS NOT NULL AS applications_present,
  to_regclass('public.companies') IS NOT NULL AS companies_present,
  to_regclass('public.employer_candidate_invites') IS NOT NULL AS invites_present,
  to_regclass('public.billing_events') IS NOT NULL AS billing_events_present,
  to_regprocedure('public.current_employer_entitlements()') IS NOT NULL AS entitlements_present,
  to_regprocedure('public.append_security_audit(text,text,text,jsonb)') IS NOT NULL AS audit_present;
`;

const bundle = [
  "-- HireGeneral disposable test schema bundle.",
  "-- Generated from checked-in migrations; never run against production.",
  "BEGIN;",
  ...sections,
  "COMMIT;",
  verification,
].join("\n");

await writeFile(outputPath, bundle, { mode: 0o600 });
console.log(`Wrote ${files.length} ordered migrations to ${outputPath}`);
