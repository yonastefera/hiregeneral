import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";

const migrationDirectory = resolve("src/lib/migrations");
const baseline = JSON.parse(
  await readFile(join(migrationDirectory, "migration-baseline.json"), "utf8"),
);
const outputPath =
  process.env.HIREGENERAL_TEST_SCHEMA_OUTPUT ??
  join(tmpdir(), "hiregeneral-test-schema.sql");

const historical = baseline.historicalOrder;

if (
  !Array.isArray(historical) ||
  historical.length !== baseline.historicalFileCount
) {
  throw new Error("Migration baseline has an invalid historical order.");
}

async function walk(path) {
  const children = await readdir(path, { withFileTypes: true });
  const files = await Promise.all(
    children.map((child) => {
      const childPath = join(path, child.name);
      return child.isDirectory() ? walk(childPath) : [childPath];
    }),
  );
  return files.flat();
}

const forward = (await walk(migrationDirectory))
  .filter((path) => /(?:^|\/)\d{14}_[a-z0-9_]+\.sql$/.test(path))
  .map((path) => relative(migrationDirectory, path).split(sep).join("/"))
  .sort();

const files = [...historical, ...forward];
const discovered = (await walk(migrationDirectory)).filter((path) =>
  path.endsWith(".sql"),
);
if (files.length !== discovered.length) {
  throw new Error(
    `Migration bundle inventory mismatch: selected ${files.length} of ${discovered.length} SQL files.`,
  );
}
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

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, bundle, { mode: 0o600 });
console.log(`Wrote ${files.length} ordered migrations to ${outputPath}`);
