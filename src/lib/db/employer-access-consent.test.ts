import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.resolve("src/lib/migrations/20260816073000_employer_access_consent.sql"),
  "utf8",
);

describe("employer access consent migration", () => {
  it("does not infer consent from legacy public visibility", () => {
    expect(migration).toContain("SET visibility = 'private'");
    expect(migration).toContain("employer_access_consent_at IS NULL");
    expect(migration).not.toMatch(/SET employer_access_consent_at\s*=\s*now/i);
  });

  it("prevents public profiles without recorded consent", () => {
    expect(migration).toContain("profiles_public_requires_employer_consent");
    expect(migration).toContain("visibility <> 'public'");
    expect(migration).toContain("employer_access_consent_at IS NOT NULL");
  });

  it("revokes consent when profile deletion starts", () => {
    expect(migration).toContain("NEW.visibility := 'private'");
    expect(migration).toContain("NEW.employer_access_consent_at := NULL");
    expect(migration).toContain("clear_employer_consent_on_profile_deletion");
  });
});
