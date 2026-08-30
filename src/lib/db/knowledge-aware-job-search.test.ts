import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260830163000_knowledge_aware_job_search.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const route = readFileSync(
  fileURLToPath(new URL("../../app/api/jobs/route.ts", import.meta.url)),
  "utf8",
);

describe("knowledge-aware job search", () => {
  it("ranks exact, title, skill, and related-role evidence", () => {
    expect(migration).toContain("100 AS score, 'Exact keyword evidence'");
    expect(migration).toContain("85, 'Related job title'");
    expect(migration).toContain("75, 'Matched skill alias'");
    expect(migration).toContain("45, 'Related role skill'");
  });

  it("preserves public job visibility and bounded pagination", () => {
    expect(migration).toContain("job.status = 'published'");
    expect(migration).toContain(
      "job.expires_at IS NULL OR job.expires_at > now()",
    );
    expect(migration).toContain(
      "LEAST(GREATEST(COALESCE(p_page_size, 20), 1), 25)",
    );
    expect(migration).toContain("row_number() OVER (");
    expect(migration).not.toMatch(/OFFSET\s+\(parameters\./);
  });

  it("wires the API to the versioned RPC and bumps the cache namespace", () => {
    expect(route).toContain('"search_jobs_knowledge_public"');
    expect(route).toContain('JOBS_API_CACHE_VERSION ?? "6"');
  });

  it("grants read execution without exposing graph mutations", () => {
    expect(migration).toContain("FROM PUBLIC;");
    expect(migration).toContain("TO anon, authenticated;");
    expect(migration).not.toContain("SECURITY DEFINER");
  });
});
