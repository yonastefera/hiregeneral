import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260815214500_restrict_retention_report_permissions.sql",
  ),
  "utf8",
);

describe("retention report permissions migration", () => {
  it.each(["anon", "authenticated"])(
    "explicitly revokes the %s role",
    (role) => {
      expect(migration).toMatch(
        new RegExp(
          `REVOKE ALL ON FUNCTION public\\.retention_eligibility_report\\(\\)\\s+FROM ${role}`,
          "i",
        ),
      );
    },
  );

  it("keeps service-role execution", () => {
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.retention_eligibility_report\(\)\s+TO service_role/i,
    );
  });
});
