import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260815221500_account_deletion_execution.sql",
  ),
  "utf8",
);

describe("account deletion execution migration", () => {
  it("requires the grace period before preparing deletion", () => {
    expect(migration).toContain(
      "candidate_profile.deletion_requested_at > now() - interval '14 days'",
    );
    expect(migration).toContain("ERRCODE = '23514'");
  });

  it("removes candidate records and anonymizes retained business records", () => {
    for (const table of [
      "employer_candidate_invites",
      "conversations",
      "applications",
      "saved_jobs",
      "notifications",
      "notification_preferences",
      "user_roles",
    ]) {
      expect(migration).toMatch(new RegExp(`DELETE FROM public\\.${table}`));
    }
    expect(migration).toContain("SET billing_email = NULL");
    expect(migration).toContain("notification_email = NULL");
    expect(migration).toContain("gender = NULL");
    expect(migration).toContain("disability_status = NULL");
  });

  it("uses a retryable preparation and completion boundary", () => {
    expect(migration).toContain("deletion_completed_at");
    expect(migration).toContain("already_completed");
    expect(migration).toContain("complete_account_deletion");
  });

  it.each(["prepare_account_deletion", "complete_account_deletion"])(
    "allows only service_role to execute %s",
    (functionName) => {
      expect(migration).toMatch(
        new RegExp(
          `REVOKE ALL ON FUNCTION public\\.${functionName}\\(uuid\\) FROM anon`,
        ),
      );
      expect(migration).toMatch(
        new RegExp(
          `REVOKE ALL ON FUNCTION public\\.${functionName}\\(uuid\\) FROM authenticated`,
        ),
      );
      expect(migration).toMatch(
        new RegExp(
          `GRANT EXECUTE ON FUNCTION public\\.${functionName}\\(uuid\\) TO service_role`,
        ),
      );
    },
  );
});
