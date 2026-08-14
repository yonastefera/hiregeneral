import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const directory = resolve("src/lib/migrations");
const entries = (await readdir(directory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
  .map((entry) => entry.name)
  .sort();

if (entries.length === 0) throw new Error("No SQL migrations were found.");

const dated = entries.filter((name) => /^\d{8}_.+\.sql$/.test(name));
const names = new Set();

for (const name of dated) {
  if (names.has(name)) throw new Error(`Duplicate migration name: ${name}`);
  names.add(name);

  const sql = await readFile(resolve(directory, name), "utf8");
  if (!sql.trim()) throw new Error(`Empty migration: ${name}`);
  if (/\b(?:service_role_key|SUPABASE_SERVICE_ROLE_KEY)\b/.test(sql)) {
    throw new Error(`Secret-like identifier found in migration: ${name}`);
  }
}

console.log(`Validated ${dated.length} dated SQL migrations.`);
