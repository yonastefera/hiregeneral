import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260814_job_applicant_counts_view.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("job applicant counts view migration", () => {
  it("creates the relationship expected by job queries", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE VIEW public.job_applicant_counts",
    );
    expect(migration).toContain("applications.job_id");
    expect(migration).toContain("count(*)::bigint AS applicant_count");
  });

  it("preserves application RLS for callers", () => {
    expect(migration).toContain("WITH (security_invoker = true)");
    expect(migration).toContain(
      "GRANT SELECT ON public.job_applicant_counts TO anon, authenticated",
    );
  });
});
