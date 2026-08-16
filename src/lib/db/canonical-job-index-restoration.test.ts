import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260815154500_restore_canonical_job_indexes.sql",
  ),
  "utf8",
);

describe("canonical jobs index restoration", () => {
  it.each(["jobs_category_idx", "jobs_published_posted_at_idx"])(
    "creates the supporting %s index idempotently",
    (indexName) => {
      expect(migration).toContain(`CREATE INDEX IF NOT EXISTS ${indexName}`);
    },
  );

  it.each(["jobs_slug_key", "jobs_source_name_source_id_key"])(
    "restores the %s unique constraint when missing",
    (constraintName) => {
      expect(migration).toContain(`conname = '${constraintName}'`);
      expect(migration).toContain(`ADD CONSTRAINT ${constraintName}`);
      expect(migration).toContain(`UNIQUE USING INDEX ${constraintName}`);
    },
  );
});
