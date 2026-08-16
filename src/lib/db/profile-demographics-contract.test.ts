import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260816060000_drop_profile_demographic_columns.sql",
  ),
  "utf8",
);

const legacyColumns = [
  "gender",
  "gender_self_describe",
  "ethnicity",
  "ethnicity_self_describe",
  "veteran_status",
  "disability_status",
];

describe("profile demographics contract migration", () => {
  it("replaces account deletion before dropping legacy columns", () => {
    expect(migration.indexOf("CREATE OR REPLACE FUNCTION")).toBeLessThan(
      migration.indexOf("ALTER TABLE public.profiles"),
    );
    expect(migration).toContain("DELETE FROM public.user_roles");
    expect(migration).toContain("deleted_at = now()");
  });

  it.each(legacyColumns)("drops the legacy %s column", (column) => {
    expect(migration).toContain(`DROP COLUMN IF EXISTS ${column}`);
  });

  it("keeps the deletion function restricted to service_role", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.prepare_account_deletion(uuid) FROM anon",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.prepare_account_deletion(uuid) FROM authenticated",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.prepare_account_deletion(uuid) TO service_role",
    );
  });
});
