import { execFile } from "node:child_process";
import { mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { format } from "prettier";

const exec = promisify(execFile);
const target = resolve("src/lib/supabase/types.ts");
const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
const databaseUrl = process.env.SUPABASE_DB_URL?.trim();
const useLocal = process.env.SUPABASE_TYPES_LOCAL === "1";
const selected = [Boolean(projectRef), Boolean(databaseUrl), useLocal].filter(
  Boolean,
).length;

if (selected !== 1) {
  throw new Error(
    "Choose exactly one type source: SUPABASE_PROJECT_REF, SUPABASE_DB_URL, or SUPABASE_TYPES_LOCAL=1.",
  );
}

const args = ["gen", "types", "typescript", "--schema", "public"];
if (projectRef) args.push("--project-id", projectRef);
if (databaseUrl) args.push("--db-url", databaseUrl);
if (useLocal) args.push("--local");

const { stdout } = await exec("supabase", args, {
  maxBuffer: 20 * 1024 * 1024,
});
if (!stdout.includes("export type Database")) {
  throw new Error("Supabase CLI returned an unexpected type definition.");
}

const generated = await format(`${stdout.trim()}\n`, { parser: "typescript" });
if (process.env.SUPABASE_TYPES_CHECK === "1") {
  const current = await readFile(target, "utf8");
  if (current !== generated) {
    throw new Error(
      "Generated Supabase types are stale. Run npm run db:types and commit the result.",
    );
  }
  console.log("Generated Supabase types are current.");
} else {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "hiregeneral-types-"),
  );
  const temporaryFile = join(temporaryDirectory, "types.ts");
  try {
    await writeFile(temporaryFile, generated, { mode: 0o600 });
    await rename(temporaryFile, target);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  console.log(`Updated ${target}`);
}
