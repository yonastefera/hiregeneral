import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260905110000_aggregate_home_insights.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const loader = readFileSync(
  fileURLToPath(new URL("../../home/home-insights.ts", import.meta.url)),
  "utf8",
);

describe("home insight aggregation", () => {
  it("bounds work and aggregates before returning data", () => {
    expect(migration).toContain("LIMIT 3000");
    expect(migration).toContain("percentile_cont(0.25)");
    expect(migration).toContain("count(*)::INTEGER AS job_count");
    expect(migration).toContain("LIMIT 4");
    expect(migration).toContain("LIMIT 6");
  });

  it("returns summaries without full job records", () => {
    expect(migration).toContain("'salaryBands'");
    expect(migration).toContain("'marketCategories'");
    expect(migration).not.toContain("jsonb_agg(to_jsonb(job))");
  });

  it("uses the aggregate RPC instead of selecting thousands of jobs", () => {
    expect(loader).toContain('rpc("get_home_insights_public")');
    expect(loader).not.toContain("INSIGHT_LIMIT");
    expect(loader).not.toContain('.from("jobs")');
  });

  it("uses invoker security with explicit read-only execution", () => {
    expect(migration).not.toContain("SECURITY DEFINER");
    expect(migration).toContain("FROM PUBLIC;");
    expect(migration).toContain("TO anon, authenticated, service_role;");
  });
});
