import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
  new URL(
    "../migrations/20260802_rls_authorization_followup.sql",
    import.meta.url,
  ),
);
const migration = readFileSync(migrationPath, "utf8");

describe("RLS authorization follow-up migration", () => {
  it("removes authenticated writes to billing-backed job boosts", () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Employers can manage their job boosts"',
    );
    expect(migration).not.toContain('CREATE POLICY "Employers can manage');
  });

  it("limits saved jobs to job seekers and eligible jobs", () => {
    expect(migration).toContain("public.has_role(auth.uid(), 'job_seeker')");
    expect(migration).toContain("jobs.status = 'published'");
    expect(migration).toContain("jobs.expires_at > now()");
  });

  it("validates invite targets and prevents invite retargeting", () => {
    expect(migration).toContain("profiles.user_type = 'job_seeker'");
    expect(migration).toContain("profiles.visibility = 'public'");
    expect(migration).toContain("protect_candidate_invite_identity");
    expect(migration).toContain(
      "NEW.candidate_id IS DISTINCT FROM OLD.candidate_id",
    );
  });

  it("makes sent message bodies immutable", () => {
    expect(migration).toContain("NEW.body IS DISTINCT FROM OLD.body");
    expect(migration).toContain(
      "Sent message content and ownership fields cannot be changed",
    );
  });
});
