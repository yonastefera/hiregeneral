import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260802_employer_entitlement_enforcement.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("server-authoritative employer entitlements", () => {
  it("publishes one authenticated entitlement snapshot", () => {
    expect(migration).toContain("public.current_employer_entitlements()");
    expect(migration).toContain("TO authenticated");
    expect(migration).toContain("'candidateDatabase', paid_active");
    expect(migration).toContain("'premiumAnalytics', effective_plan = 'pro'");
  });

  it("serializes and enforces active-job and boost-credit mutations", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain(
      "current_active_jobs >= company.active_job_limit",
    );
    expect(migration).toContain("SET boost_credits = boost_credits - 1");
    expect(migration).toContain("BEFORE INSERT OR UPDATE ON public.jobs");
  });

  it("enforces paid invitation and monthly messaging limits", () => {
    expect(migration).toContain(
      "Candidate invitations require an active paid plan",
    );
    expect(migration).toContain("Monthly invitation limit reached");
    expect(migration).toContain("Monthly employer messaging limit reached");
    expect(migration).toContain(
      "BEFORE INSERT ON public.employer_candidate_invites",
    );
    expect(migration).toContain("BEFORE INSERT ON public.messages");
  });

  it("limits public sourcing while preserving applicant access", () => {
    expect(migration).toContain(
      'CREATE POLICY "Owners admins and entitled recruiters can view profiles"',
    );
    expect(migration).toContain("applications.user_id = profiles.user_id");
    expect(migration).toContain("companies.billing_plan IN ('growth', 'pro')");
  });
});
