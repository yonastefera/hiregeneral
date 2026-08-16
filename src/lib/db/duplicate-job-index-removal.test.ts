import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260815153000_remove_exact_duplicate_job_indexes.sql",
  ),
  "utf8",
);

describe("exact duplicate jobs index removal", () => {
  it.each([
    "idx_jobs_category",
    "idx_jobs_slug",
    "idx_jobs_slug_unique",
    "idx_jobs_source_unique",
    "idx_jobs_published_posted_at",
  ])("drops the duplicate %s index", (indexName) => {
    expect(migration).toContain(`DROP INDEX IF EXISTS public.${indexName};`);
  });

  it.each([
    "jobs_category_idx",
    "jobs_slug_key",
    "jobs_source_name_source_id_key",
    "jobs_published_posted_at_idx",
  ])("preserves the retained %s index", (indexName) => {
    expect(migration).not.toContain(
      `DROP INDEX IF EXISTS public.${indexName};`,
    );
  });
});
