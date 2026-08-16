import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260815211000_account_deletion_grace_period.sql",
  ),
  "utf8",
);

describe("account deletion grace period migration", () => {
  it("requires a previously recorded request to be at least fourteen days old", () => {
    expect(migration).toContain("OLD.deletion_requested_at IS NULL");
    expect(migration).toContain(
      "OLD.deletion_requested_at > now() - interval '14 days'",
    );
    expect(migration).toContain("ERRCODE = '23514'");
  });

  it("indexes pending requests and audits cancellation", () => {
    expect(migration).toContain("profiles_pending_deletion_idx");
    expect(migration).toContain("account.deletion_cancelled");
    expect(migration).toContain(
      "CREATE TRIGGER enforce_account_deletion_grace_period",
    );
  });
});
