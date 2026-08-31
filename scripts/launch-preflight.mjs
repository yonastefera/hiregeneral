import { readFile } from "node:fs/promises";
import process from "node:process";

import dotenv from "dotenv";

const envFileArgument = process.argv.find((argument) =>
  argument.startsWith("--env-file="),
);
const envFile = envFileArgument?.slice("--env-file=".length);

if (envFile) {
  const result = dotenv.config({ path: envFile, override: true });
  if (result.error) {
    console.error(`Could not load environment file: ${envFile}`);
    process.exit(1);
  }
}

const requiredValues = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AUTH_RECOVERY_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CONTACT_TO_EMAIL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "INGEST_SECRET",
  "CRON_SECRET",
  "SYSTEM_RECRUITER_ID",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_GROWTH_MONTHLY_PRICE_ID",
  "STRIPE_PRO_MONTHLY_PRICE_ID",
];

const failures = [];
const passes = [];

function check(condition, success, failure) {
  if (condition) passes.push(success);
  else failures.push(failure);
}

function configured(name) {
  const value = process.env[name]?.trim();
  return Boolean(value && !/placeholder|example/i.test(value));
}

function productionUrl(name) {
  try {
    const url = new URL(process.env[name]);
    return (
      url.protocol === "https:" &&
      !["localhost", "127.0.0.1"].includes(url.hostname) &&
      !url.hostname.endsWith(".test")
    );
  } catch {
    return false;
  }
}

for (const name of requiredValues) {
  check(configured(name), `${name} is configured`, `${name} is missing`);
}

for (const name of [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "UPSTASH_REDIS_REST_URL",
]) {
  check(
    productionUrl(name),
    `${name} uses production HTTPS`,
    `${name} must use a non-local HTTPS URL`,
  );
}

try {
  const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
  const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
  check(
    appOrigin === siteOrigin,
    "Application and canonical site origins match",
    "NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_SITE_URL must share an origin",
  );
} catch {
  failures.push("Application URLs could not be compared");
}

check(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    process.env.SYSTEM_RECRUITER_ID ?? "",
  ),
  "SYSTEM_RECRUITER_ID is a UUID",
  "SYSTEM_RECRUITER_ID must be a UUID",
);
check(
  process.env.CSP_ENFORCE === "true",
  "Content Security Policy enforcement is enabled",
  "CSP_ENFORCE must be true for launch",
);
check(
  process.env.ACCOUNT_DELETION_EXECUTION_ENABLED === "false",
  "Account deletion execution remains safely gated",
  "ACCOUNT_DELETION_EXECUTION_ENABLED must remain false until privacy gates are signed off",
);
check(
  ["true", "false"].includes(process.env.NEXT_PUBLIC_ENABLE_ANALYTICS ?? ""),
  "Analytics consent mode is explicitly configured",
  "NEXT_PUBLIC_ENABLE_ANALYTICS must explicitly be true or false",
);

const [vercelConfig, ciWorkflow, backupWorkflow] = await Promise.all([
  readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
  readFile(
    new URL(
      "../.github/workflows/encrypted-database-backup.yml",
      import.meta.url,
    ),
    "utf8",
  ),
]);

for (const route of [
  "/api/ingest/jobs",
  "/api/internal/account-deletions",
  "/api/internal/job-alerts",
]) {
  check(
    vercelConfig.includes(route),
    `${route} cron is declared`,
    `${route} cron is missing from vercel.json`,
  );
}

for (const command of [
  "npm run test:e2e",
  "npm run security:audit",
  "npm run test:migrations",
]) {
  check(
    ciWorkflow.includes(command),
    `${command} is enforced by CI`,
    `${command} is missing from CI`,
  );
}

check(
  backupWorkflow.includes('cron: "17 7 * * 0"'),
  "Weekly encrypted backup is scheduled",
  "Weekly encrypted backup schedule is missing",
);

console.log(`Launch preflight: ${passes.length} checks passed.`);
for (const failure of failures) console.error(`- ${failure}`);

if (failures.length > 0) {
  console.error(`Launch preflight failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("Launch preflight passed. No secret values were printed.");
