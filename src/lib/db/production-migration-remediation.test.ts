import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../migrations/20260815143000_restore_role_assignment_and_enrichment_access.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("production migration gap remediation", () => {
  it("restores atomic audited role assignment for service-role callers", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.auth_role_audit_log",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.assign_initial_role",
    );
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("p_source NOT IN");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });

  it("allows only policy-filtered enrichment reads from browser roles", () => {
    expect(migration).toContain(
      'CREATE POLICY "Public can view published job enrichments"',
    );
    expect(migration).toContain("jobs.status = 'published'::public.job_status");
    expect(migration).toContain(
      "GRANT SELECT ON public.job_enrichments TO anon, authenticated",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON public.job_enrichments",
    );
  });
});
