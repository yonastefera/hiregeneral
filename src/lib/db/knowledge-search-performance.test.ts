import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260830231500_optimize_knowledge_job_search.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("knowledge search performance remediation", () => {
  it("uses the indexed trigram-compatible search predicate", () => {
    expect(migration).toContain(
      "job.search_text LIKE '%' || parameters.query || '%'",
    );
    expect(migration).not.toContain(
      "position(parameters.query IN job.search_text)",
    );
  });

  it("preserves bounded pagination, visibility, and grants", () => {
    expect(migration).toContain("job.status = 'published'");
    expect(migration).toContain(
      "LEAST(GREATEST(COALESCE(p_page_size, 20), 1), 25)",
    );
    expect(migration).toContain("FROM PUBLIC;");
    expect(migration).toContain("TO anon, authenticated;");
  });
});
