import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  retrieveCustomer: vi.fn(),
}));

vi.mock("@/lib/stripe/server", () => ({
  retrieveStripeCustomer: mocks.retrieveCustomer,
}));

import {
  assertStripeCustomerOwnership,
  isTrustedStripeRedirect,
} from "@/lib/stripe/ownership";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Stripe ownership and redirects", () => {
  it("accepts a customer whose immutable company metadata matches", async () => {
    mocks.retrieveCustomer.mockResolvedValue({
      id: "cus_123",
      metadata: { companyId: "company_123" },
    });

    await expect(
      assertStripeCustomerOwnership({
        customerId: "cus_123",
        companyId: "company_123",
      }),
    ).resolves.toEqual(expect.objectContaining({ id: "cus_123" }));
  });

  it.each([
    { id: "cus_wrong", metadata: { companyId: "company_123" } },
    { id: "cus_123", metadata: { companyId: "company_wrong" } },
    { id: "cus_123", metadata: {} },
  ])("rejects mismatched or missing ownership metadata", async (customer) => {
    mocks.retrieveCustomer.mockResolvedValue(customer);

    await expect(
      assertStripeCustomerOwnership({
        customerId: "cus_123",
        companyId: "company_123",
      }),
    ).rejects.toThrow("ownership verification failed");
  });

  it.each([
    "https://checkout.stripe.com/c/pay/cs_test",
    "https://billing.stripe.com/p/session/test",
  ])("allows Stripe-hosted redirect %s", (url) => {
    expect(isTrustedStripeRedirect(url)).toBe(true);
  });

  it.each([
    "http://checkout.stripe.com/session",
    "https://stripe.com.evil.example/session",
    "https://evilstripe.com/session",
    "javascript:alert(1)",
    null,
  ])("rejects untrusted redirect %s", (url) => {
    expect(isTrustedStripeRedirect(url)).toBe(false);
  });
});
