import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL("../migrations/20260809_job_enrichments_rls.sql", import.meta.url),
  ),
  "utf8",
);

describe("job enrichment RLS migration", () => {
  it("enables RLS and restricts reads to active published jobs", () => {
    expect(migration).toContain(
      "ALTER TABLE public.job_enrichments ENABLE ROW LEVEL SECURITY",
    );
    expect(migration).toContain("jobs.status = 'published'::public.job_status");
    expect(migration).toContain("jobs.expires_at > now()");
  });

  it("does not grant client-side writes", () => {
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON public.job_enrichments",
    );
    expect(migration).not.toMatch(/FOR (?:INSERT|UPDATE|DELETE)/);
  });
});
