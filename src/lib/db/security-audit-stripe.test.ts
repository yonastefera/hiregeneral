import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260802_security_audit_and_stripe_idempotency.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("security audit and Stripe idempotency migration", () => {
  it("atomically claims new, failed, or stale Stripe events", () => {
    expect(migration).toContain("public.claim_billing_event");
    expect(migration).toContain("ON CONFLICT (stripe_event_id) DO UPDATE");
    expect(migration).toContain("public.billing_events.status = 'failed'");
    expect(migration).toContain("interval '10 minutes'");
  });

  it("restricts event lifecycle RPCs to the service role", () => {
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.claim_billing_event(TEXT, TEXT) TO service_role",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.finish_billing_event(TEXT, UUID, TEXT)",
    );
  });

  it("audits each required security category", () => {
    expect(migration).toContain("audit_job_lifecycle");
    expect(migration).toContain("audit_employer_invitation");
    expect(migration).toContain("audit_company_billing_change");
    expect(migration).toContain("audit_billing_receipt");
    expect(migration).toContain("audit_job_boost");
    expect(migration).toContain("audit_account_deletion");
  });

  it("allows only admins to read the append-only audit log", () => {
    expect(migration).toContain(
      'CREATE POLICY "Admins can view security audit log"',
    );
    expect(migration).toContain("public.has_role(auth.uid(), 'admin')");
    expect(migration).not.toContain(
      "ON public.security_audit_log FOR INSERT TO authenticated",
    );
  });
});
