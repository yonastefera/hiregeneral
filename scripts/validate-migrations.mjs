import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const directory = resolve("src/lib/migrations");
const baseline = JSON.parse(
  await readFile(join(directory, "migration-baseline.json"), "utf8"),
);

async function walk(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const child = join(path, entry.name);
      return entry.isDirectory() ? walk(child) : [child];
    }),
  );
  return files.flat();
}

const paths = (await walk(directory))
  .filter((path) => path.endsWith(".sql"))
  .map((path) => ({
    absolute: path,
    relative: relative(directory, path).split(sep).join("/"),
  }))
  .sort((left, right) => left.relative.localeCompare(right.relative));

if (paths.length === 0) throw new Error("No SQL migrations were found.");

const forwardPattern = /^\d{14}_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;
const forward = paths.filter(({ relative: name }) => forwardPattern.test(name));
const historical = paths.filter(
  ({ relative: name }) => !forwardPattern.test(name),
);

for (const { absolute, relative: name } of paths) {
  const sql = await readFile(absolute, "utf8");
  if (!sql.trim()) throw new Error(`Empty migration: ${name}`);
  if (/\b(?:service_role_key|SUPABASE_SERVICE_ROLE_KEY)\b/.test(sql)) {
    throw new Error(`Secret-like identifier found in migration: ${name}`);
  }
}

const historicalHash = createHash("sha256");
for (const { absolute, relative: name } of historical) {
  historicalHash.update(name);
  historicalHash.update("\0");
  historicalHash.update(await readFile(absolute));
  historicalHash.update("\0");
}

const digest = historicalHash.digest("hex");
if (
  historical.length !== baseline.historicalFileCount ||
  digest !== baseline.historicalSha256
) {
  throw new Error(
    "Historical migration files changed. Never rename, edit, move, or delete baseline migrations; add a new forward migration instead.",
  );
}

const timestamps = new Set();
for (const { relative: name } of forward) {
  if (name.includes("/")) {
    throw new Error(`New migration must be at the canonical root: ${name}`);
  }
  const timestamp = name.slice(0, 14);
  if (timestamps.has(timestamp)) {
    throw new Error(`Duplicate forward migration timestamp: ${timestamp}`);
  }
  timestamps.add(timestamp);
}

console.log(
  `Validated immutable baseline (${historical.length} files, ${digest.slice(0, 12)}…) and ${forward.length} forward migrations.`,
);
