import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const outputDirectory = resolve(required("STORAGE_BACKUP_DIR"));
const headers = { apikey: serviceRoleKey };
if (!serviceRoleKey.startsWith("sb_secret_")) {
  headers.authorization = `Bearer ${serviceRoleKey}`;
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(`Required environment variable is not set: ${name}`);
  return value;
}

function safeSegments(value) {
  const segments = value.split("/").filter(Boolean);
  if (
    segments.some(
      (segment) => segment === "." || segment === ".." || segment.includes(sep),
    )
  ) {
    throw new Error(`Unsafe Storage object path: ${value}`);
  }
  return segments;
}

async function request(path, init = {}) {
  const response = await fetch(`${supabaseUrl}/storage/v1${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
  if (!response.ok) {
    throw new Error(`Storage API ${response.status} for ${path}`);
  }
  return response;
}

async function listBuckets() {
  return (await request("/bucket")).json();
}

async function listObjects(bucketId, prefix = "") {
  const objects = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const page = await (
      await request(`/object/list/${encodeURIComponent(bucketId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prefix,
          limit,
          offset,
          sortBy: { column: "name", order: "asc" },
        }),
      })
    ).json();
    objects.push(...page);
    if (page.length < limit) return objects;
    offset += page.length;
  }
}

async function walk(bucketId, prefix = "") {
  const entries = await listObjects(bucketId, prefix);
  for (const entry of entries) {
    const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id == null) {
      await walk(bucketId, objectPath);
      continue;
    }

    const localPath = resolve(
      outputDirectory,
      ...safeSegments(bucketId),
      ...safeSegments(objectPath),
    );
    if (!localPath.startsWith(`${outputDirectory}${sep}`)) {
      throw new Error(`Storage object escaped backup directory: ${objectPath}`);
    }
    await mkdir(dirname(localPath), { recursive: true });
    const response = await request(
      `/object/authenticated/${encodeURIComponent(bucketId)}/${safeSegments(objectPath).map(encodeURIComponent).join("/")}`,
    );
    if (!response.body)
      throw new Error(`Storage object had no body: ${objectPath}`);
    await pipeline(
      Readable.fromWeb(response.body),
      createWriteStream(localPath, { mode: 0o600 }),
    );
  }
}

await mkdir(outputDirectory, { recursive: true, mode: 0o700 });
const buckets = await listBuckets();
for (const bucket of buckets) await walk(bucket.id);
console.log(`Backed up ${buckets.length} Storage buckets.`);
