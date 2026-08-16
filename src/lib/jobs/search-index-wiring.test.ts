import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260815160000_canonicalize_job_search_text.sql",
  ),
  "utf8",
);
const route = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/jobs/route.ts"),
  "utf8",
);

describe("indexed public job keyword search", () => {
  it("maintains and backfills all four public keyword fields", () => {
    for (const field of ["title", "company_name", "description", "category"]) {
      expect(migration).toContain(`coalesce(NEW.${field}, '')`);
      expect(migration).toContain(`coalesce(${field}, '')`);
    }

    expect(migration).toContain("CREATE TRIGGER maintain_job_search_text");
    expect(migration).toContain(
      "CREATE INDEX IF NOT EXISTS jobs_search_text_trgm_idx",
    );
  });

  it("routes keyword search through the consolidated indexed document", () => {
    expect(route).toContain('request = request.ilike("search_text", pattern);');
    expect(route).not.toContain("`description.ilike.${pattern}`");
  });
});
