import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260815213000_retention_eligibility_report.sql",
  ),
  "utf8",
);

describe("retention eligibility report migration", () => {
  it("reports each approved retention category without deleting data", () => {
    expect(migration).toContain("'report_only', true");
    expect(migration).toContain("interval '14 days'");
    expect(migration).toContain("interval '12 months'");
    expect(migration).toContain("interval '180 days'");
    expect(migration.match(/interval '24 months'/g)).toHaveLength(4);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
  });

  it("restricts the report to the service role", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.retention_eligibility_report() FROM PUBLIC",
    );
    expect(migration).toContain("TO service_role");
  });
});
