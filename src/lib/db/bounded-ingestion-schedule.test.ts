import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "src/lib/migrations/20260905090000_schedule_bounded_job_ingestion.sql",
  ),
  "utf8",
).toLowerCase();

describe("bounded ingestion schedule migration", () => {
  it("reports each source's latest attempt", () => {
    expect(migration).toContain(
      "function public.get_job_ingestion_source_schedule()",
    );
    expect(migration).toContain("max(runs.started_at) as last_attempt_at");
    expect(migration).toContain("group by runs.source_name, runs.source_slug");
  });

  it("keeps scheduling data service-role only", () => {
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
  });
});
