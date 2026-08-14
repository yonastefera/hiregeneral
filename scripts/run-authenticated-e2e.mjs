import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

import { config as loadEnv } from "dotenv";

const loaded = loadEnv({ path: resolve(".env.rls.test"), quiet: true });

if (loaded.error) {
  throw new Error("Authenticated E2E requires the ignored .env.rls.test file.");
}

const required = [
  "SUPABASE_TEST_URL",
  "SUPABASE_TEST_ANON_KEY",
  "SUPABASE_TEST_SERVICE_ROLE_KEY",
  "SUPABASE_TEST_SEEKER_EMAIL",
  "SUPABASE_TEST_SEEKER_PASSWORD",
  "SUPABASE_TEST_RECRUITER_A_EMAIL",
  "SUPABASE_TEST_RECRUITER_A_PASSWORD",
];

for (const name of required) {
  if (!process.env[name]?.trim()) {
    throw new Error(`Authenticated E2E requires ${name}.`);
  }
}

const testUrl = new URL(process.env.SUPABASE_TEST_URL);
const projectRef = testUrl.hostname.split(".")[0];
const productionProjectRef = "svzsorgmgvvmikrwboaq";

if (
  testUrl.protocol !== "https:" ||
  !testUrl.hostname.endsWith(".supabase.co") ||
  projectRef === productionProjectRef
) {
  throw new Error(
    "Refusing authenticated E2E: SUPABASE_TEST_URL is not an approved non-production Supabase project.",
  );
}

if (process.env.RUN_AUTHENTICATED_E2E !== "1") {
  throw new Error(
    "Set RUN_AUTHENTICATED_E2E=1 to acknowledge that these tests mutate and clean up the dedicated test project.",
  );
}

const childEnv = {
  ...process.env,
  NEXT_DIST_DIR: ".next-e2e-auth",
  NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_TEST_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_TEST_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_TEST_SERVICE_ROLE_KEY,
};

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: childEnv,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} failed${signal ? ` with ${signal}` : ` with exit code ${code}`}.`,
        ),
      );
    });
  });
}

console.log(`Authenticated E2E target: dedicated project ${projectRef}`);
await run("npx", ["next", "build"]);
await run("npx", [
  "playwright",
  "test",
  "--config",
  "playwright.authenticated.config.ts",
]);
