import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("src/lib/migrations/20260814_profile_schema_parity.sql"),
  "utf8",
);

describe("profile schema parity migration", () => {
  it.each([
    "city",
    "state",
    "zip_code",
    "avatar_url",
    "work_experience",
    "profile_links",
    "education",
    "achievements",
    "licenses_certifications",
    "executive_summary",
    "objective",
    "open_to_relocation",
    "minimum_desired_pay",
    "level_of_experience",
    "highest_degree",
    "industry",
    "gender_self_describe",
    "ethnicity_self_describe",
  ])("adds the %s profile field idempotently", (column) => {
    expect(migration).toMatch(
      new RegExp(`ADD COLUMN IF NOT EXISTS ${column}\\b`, "i"),
    );
  });
});
