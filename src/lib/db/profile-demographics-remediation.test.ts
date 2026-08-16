import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260816063000_restore_profile_demographics_table.sql",
  ),
  "utf8",
);

describe("profile demographics remediation", () => {
  it("idempotently restores the separated table", () => {
    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.profile_demographics",
    );
    expect(migration).not.toMatch(/\bDROP TABLE\b/i);
    expect(migration).not.toMatch(/\bUPDATE public\.profiles\b/i);
  });

  it("restores owner-only policies and denies anon", () => {
    expect(migration.match(/CREATE POLICY/g)).toHaveLength(4);
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.profile_demographics FROM PUBLIC, anon",
    );
  });

  it("restores account-deletion cleanup", () => {
    expect(migration).toContain("delete_demographics_for_deleted_profile");
    expect(migration).toContain(
      "DELETE FROM public.profile_demographics WHERE profile_id = NEW.id",
    );
  });
});
