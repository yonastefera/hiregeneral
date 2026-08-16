import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.resolve(
    "src/lib/migrations/20260816070000_restrict_recruiter_profile_access.sql",
  ),
  "utf8",
);

describe("recruiter profile privacy boundary", () => {
  it("removes recruiter access to complete profile rows", () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Owners admins and recruiters can view profiles"',
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Owners admins and entitled recruiters can view profiles"',
    );
    expect(migration).toContain(
      'CREATE POLICY "Owners and admins can view profiles"',
    );
    expect(migration).not.toMatch(/visibility\s*=\s*'public'/i);
  });

  it("does not load candidate email for employer message labels", () => {
    const source = fs.readFileSync(
      path.resolve("src/employer/dashboard/messages/employer-messages-data.ts"),
      "utf8",
    );

    expect(source).not.toContain("user_id, full_name, headline, email");
    expect(source).not.toContain("profile?.email");
  });

  it("requires candidate-database entitlement inside shared loaders", () => {
    for (const sourcePath of [
      "src/employer/dashboard/database/employer-resume-database-data.ts",
      "src/employer/dashboard/invite/employer-invite-data.ts",
    ]) {
      const source = fs.readFileSync(path.resolve(sourcePath), "utf8");
      expect(source).toContain("loadEmployerEntitlements");
      expect(source).toContain("candidateDatabase");
      expect(source).toContain("employer_access_consent_at");
    }
  });
});
