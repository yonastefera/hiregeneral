import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260802_stripe_lifecycle_ordering.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("Stripe lifecycle ordering migration", () => {
  it("serializes company updates and ignores older Stripe events", () => {
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain(
      "p_event_created < target_company.billing_last_event_created",
    );
    expect(migration).toContain("billing_last_event_created = p_event_created");
  });

  it("rejects customer and subscription ownership mismatches", () => {
    expect(migration).toContain("Stripe customer does not belong to company");
    expect(migration).toContain(
      "Stripe subscription does not belong to company",
    );
    expect(migration).toContain("companies_stripe_customer_unique");
    expect(migration).toContain("companies_stripe_subscription_unique");
  });

  it("grants the apply RPC only to the service role", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.apply_company_billing_event",
    );
    expect(migration).toContain("TO service_role");
  });
});
