import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "src/lib/migrations/20260829043000_scalable_job_ingestion.sql",
  ),
  "utf8",
).toLowerCase();

describe("scalable ingestion migration", () => {
  it("creates durable staging and dead-letter storage", () => {
    expect(migration).toContain(
      "create table if not exists public.job_ingestion_staging",
    );
    expect(migration).toContain(
      "create table if not exists public.job_ingestion_dead_letters",
    );
    expect(migration).toContain("idx_job_ingestion_runs_one_active_source");
  });

  it("publishes staged jobs and closes stale jobs in one database function", () => {
    expect(migration).toContain("function public.publish_job_ingestion_stage");
    expect(migration).toContain("insert into public.jobs");
    expect(migration).toContain(
      "on conflict (source_name, source_id) do update",
    );
    expect(migration).toContain("set status = 'closed'");
    expect(migration).toContain("for update");
  });

  it("keeps the publish function service-role only", () => {
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
  });
});
