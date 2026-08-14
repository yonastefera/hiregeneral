import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260814_application_submission_fields.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

const protectedFields = [
  "applicant_full_name",
  "applicant_email",
  "applicant_phone",
  "applicant_location",
  "applicant_linkedin",
  "applicant_portfolio",
  "years_experience",
  "work_authorization",
  "requires_sponsorship",
];

describe("application submission fields migration", () => {
  it.each(protectedFields)("creates %s idempotently", (field) => {
    expect(migration).toMatch(
      new RegExp(`ADD COLUMN IF NOT EXISTS ${field}\\s+TEXT`),
    );
  });

  it("constrains form enum values at the database boundary", () => {
    expect(migration).toContain("'0-1', '2-4', '5-7', '8+'");
    expect(migration).toContain("'citizen', 'permanent', 'visa', 'other'");
    expect(migration).toContain("'no', 'yes', 'future'");
  });
});
