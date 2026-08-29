import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const supabaseUrl = required("RESTORE_SUPABASE_URL").replace(/\/$/, "");
const serviceRoleKey = required("RESTORE_SUPABASE_SERVICE_ROLE_KEY");
const inputDirectory = resolve(required("STORAGE_RESTORE_DIR"));
const authorizationHeaders = { apikey: serviceRoleKey };
if (!serviceRoleKey.startsWith("sb_secret_")) {
  authorizationHeaders.authorization = `Bearer ${serviceRoleKey}`;
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(`Required environment variable is not set: ${name}`);
  return value;
}

if (process.env.ALLOW_TEST_STORAGE_RESTORE !== "YES_I_UNDERSTAND") {
  throw new Error(
    "Refusing Storage restore. Set ALLOW_TEST_STORAGE_RESTORE=YES_I_UNDERSTAND.",
  );
}
if (process.env.PRODUCTION_SUPABASE_URL?.replace(/\/$/, "") === supabaseUrl) {
  throw new Error("Refusing to restore Storage objects into production.");
}

async function files(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const child = resolve(path, entry.name);
      return entry.isDirectory() ? files(child) : [child];
    }),
  );
  return nested.flat();
}

for (const file of await files(inputDirectory)) {
  if (!(await stat(file)).isFile()) continue;
  const parts = relative(inputDirectory, file).split(sep);
  const bucket = parts.shift();
  if (!bucket || parts.length === 0)
    throw new Error(`Invalid backed-up object path: ${file}`);
  const objectPath = parts.map(encodeURIComponent).join("/");
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`,
    {
      method: "POST",
      headers: {
        ...authorizationHeaders,
        "x-upsert": "true",
      },
      body: createReadStream(file),
      duplex: "half",
    },
  );
  if (!response.ok)
    throw new Error(
      `Storage restore ${response.status} for ${bucket}/${parts.join("/")}`,
    );
}

console.log("Storage object restore completed.");
