import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260830181500_restore_profile_experience_column.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("profile experience schema-drift repair", () => {
  it("restores only the missing ranking field idempotently", () => {
    expect(migration).toContain(
      "ADD COLUMN IF NOT EXISTS level_of_experience TEXT",
    );
    expect(migration).not.toMatch(
      /gender|ethnicity|veteran_status|disability_status/,
    );
  });
});
