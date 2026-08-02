import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
  new URL(
    "../migrations/20260802_rls_authorization_hardening.sql",
    import.meta.url,
  ),
);
const migration = readFileSync(migrationPath, "utf8");

describe("RLS authorization hardening migration", () => {
  it("restricts application creation to eligible published jobs", () => {
    expect(migration).toContain("status = 'submitted'");
    expect(migration).toContain("public.has_role(auth.uid(), 'job_seeker')");
    expect(migration).toContain("jobs.status = 'published'");
    expect(migration).toContain("jobs.expires_at > now()");
  });

  it("protects application ownership and employer-managed status", () => {
    expect(migration).toContain("NEW.user_id IS DISTINCT FROM OLD.user_id");
    expect(migration).toContain("NEW.job_id IS DISTINCT FROM OLD.job_id");
    expect(migration).toContain(
      "Applicants cannot change employer-managed status",
    );
    expect(migration).toContain(
      "Recruiters can only change employer-managed application fields",
    );
  });

  it("protects role, billing, conversation, message, and notification identity", () => {
    expect(migration).toContain("protect_profile_identity");
    expect(migration).toContain("protect_company_authorization_fields");
    expect(migration).toContain("protect_conversation_identity");
    expect(migration).toContain("protect_message_identity");
    expect(migration).toContain("protect_notification_identity");
  });
});
