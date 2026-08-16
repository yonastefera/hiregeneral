import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.resolve("src/lib/migrations/20260816080000_hiring_companies_rpc.sql"),
  "utf8",
);

describe("hiring companies RPC migration", () => {
  it("preserves the production return contract and bounds the limit", () => {
    for (const column of [
      "company_name TEXT",
      "company_logo_url TEXT",
      "company_size TEXT",
      "company_website TEXT",
      "industry TEXT",
      "roles BIGINT",
      "new_roles BIGINT",
      "has_remote BOOLEAN",
    ]) {
      expect(migration).toContain(column);
    }
    expect(migration).toContain("LEAST(GREATEST(COALESCE(p_limit, 6), 1), 12)");
  });

  it("returns only active published jobs", () => {
    expect(migration).toContain("j.status = 'published'");
    expect(migration).toContain(
      "j.expires_at IS NULL OR j.expires_at > ni.current_time",
    );
  });

  it("permits only the service role to execute", () => {
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
  });
});
