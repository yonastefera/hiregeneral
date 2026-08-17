import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { privacyPolicyContent, termsContent } from "@/legal/legal-content";
import { legalPolicyRelease } from "@/legal/policy-release";

const migration = fs.readFileSync(
  path.resolve("src/lib/migrations/20260816210000_legal_policy_acceptance.sql"),
  "utf8",
);

describe("legal launch controls", () => {
  it("keeps unapproved policy drafts out of the acceptance flow", () => {
    expect(legalPolicyRelease.approvalStatus).toBe("pending_counsel");
    expect(legalPolicyRelease.acceptanceRequired).toBe(false);
    expect(termsContent.approvalStatus).toBe("pending_counsel");
    expect(privacyPolicyContent.approvalStatus).toBe("pending_counsel");
  });

  it("does not publish placeholder arbitration or waiver language", () => {
    const text = JSON.stringify(termsContent);
    expect(text).not.toMatch(/placeholder|sample/i);
    expect(text).not.toMatch(/binding individual arbitration/i);
    expect(text).not.toMatch(/jury trial waiver|class action waiver/i);
    expect(text).toContain("Fulton County, Georgia");
  });

  it("creates an owner-readable and server-written acceptance ledger", () => {
    expect(migration).toContain("legal_policy_acceptances");
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).toMatch(/REVOKE ALL[\s\S]*anon, authenticated/i);
    expect(migration).toContain(
      "UNIQUE (user_id, document_type, document_version)",
    );
    expect(migration).not.toMatch(/FOR (?:INSERT|UPDATE|DELETE)/i);
  });
});
