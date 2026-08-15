import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const databaseUrl = process.env.MIGRATION_TEST_DATABASE_URL?.trim();
const testProjectRef = process.env.MIGRATION_TEST_PROJECT_REF?.trim();

if (process.env.RUN_MIGRATION_INTEGRATION !== "1" || !databaseUrl) {
  throw new Error(
    "Set RUN_MIGRATION_INTEGRATION=1 and MIGRATION_TEST_DATABASE_URL for a disposable Supabase-shaped database.",
  );
}

const url = new URL(databaseUrl);
const productionProjectRef = "svzsorgmgvvmikrwboaq";
const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
if (databaseUrl.includes(productionProjectRef)) {
  throw new Error("Refusing to run migration integration tests on production.");
}
if (!isLocal && (!testProjectRef || !databaseUrl.includes(testProjectRef))) {
  throw new Error(
    "Remote migration tests require MIGRATION_TEST_PROJECT_REF matching the disposable database URL.",
  );
}

const temporaryDirectory = await mkdtemp(
  join(tmpdir(), "hiregeneral-migrations-"),
);
const bundle = join(temporaryDirectory, "schema.sql");

try {
  await exec("node", ["scripts/build-test-schema-bundle.mjs"], {
    env: { ...process.env, HIREGENERAL_TEST_SCHEMA_OUTPUT: bundle },
  });
  await exec(
    "psql",
    [databaseUrl, "-X", "-v", "ON_ERROR_STOP=1", "-f", bundle],
    {
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  console.log(
    "Migration bundle applied successfully to the disposable database.",
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
