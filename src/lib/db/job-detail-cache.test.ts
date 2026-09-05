import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "src/lib/migrations/20260905080000_cache_parsed_job_details.sql",
  ),
  "utf8",
).toLowerCase();

describe("job detail cache migration", () => {
  it("stores one parsed detail entry per imported job", () => {
    expect(migration).toContain("create table public.job_detail_cache");
    expect(migration).toContain("primary key (source_name, source_id)");
    expect(migration).toContain("listing_fingerprint text not null");
    expect(migration).toContain("detail_payload jsonb not null");
  });

  it("keeps cached job content private", () => {
    expect(migration).toContain(
      "revoke all on table public.job_detail_cache from public, anon, authenticated",
    );
    expect(migration).toContain("to service_role");
  });
});
