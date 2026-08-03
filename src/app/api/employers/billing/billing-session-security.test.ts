import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  checkout: vi.fn(),
  limit: vi.fn(),
  portal: vi.fn(),
  requireEmployer: vi.fn(),
  retrieveCustomer: vi.fn(),
  summary: vi.fn(),
}));

vi.mock("@/lib/auth/require-employer-user", () => ({
  requireEmployerUser: mocks.requireEmployer,
}));

vi.mock("@/lib/rate-limit", () => ({
  employerBillingRateLimit: { limit: mocks.limit },
}));

vi.mock("@/lib/security/audit", () => ({
  recordPrivilegedAction: mocks.audit,
}));

vi.mock("@/lib/stripe/server", () => ({
  createStripeCheckoutSession: mocks.checkout,
  createStripePortalSession: mocks.portal,
  retrieveStripeCustomer: mocks.retrieveCustomer,
}));

vi.mock("@/employer/dashboard/subscription/employer-billing-data", () => ({
  getEmployerBillingSummary: mocks.summary,
}));

import { POST as createCheckout } from "@/app/api/employers/billing/create-checkout-session/route";
import { POST as createPortal } from "@/app/api/employers/billing/create-portal-session/route";

const user = { id: "user_123", email: "recruiter@example.com" };
const summary = {
  companyId: "company_123",
  plan: { stripeCustomerId: "cus_123" },
};

function checkoutRequest(body: unknown = { plan: "growth" }) {
  return new NextRequest(
    "https://attacker.example/api/employers/billing/create-checkout-session",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

function portalRequest() {
  return new NextRequest(
    "https://attacker.example/api/employers/billing/create-portal-session",
    { method: "POST" },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "https://staging.hiregeneral.com";
  process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID = "price_growth_server";
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID = "price_pro_server";

  mocks.requireEmployer.mockResolvedValue({
    user,
    supabase: { from: vi.fn() },
    error: null,
    status: 200,
  });
  mocks.limit.mockResolvedValue({
    success: true,
    reset: Date.now() + 60_000,
  });
  mocks.summary.mockResolvedValue(summary);
  mocks.retrieveCustomer.mockResolvedValue({
    id: "cus_123",
    metadata: { companyId: "company_123" },
  });
  mocks.checkout.mockResolvedValue({
    id: "cs_123",
    url: "https://checkout.stripe.com/c/pay/cs_123",
  });
  mocks.portal.mockResolvedValue({
    id: "bps_123",
    url: "https://billing.stripe.com/p/session/bps_123",
  });
  mocks.audit.mockResolvedValue(undefined);
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID;
  delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
});

describe("employer billing session security", () => {
  it.each([
    ["checkout", createCheckout, checkoutRequest()],
    ["portal", createPortal, portalRequest()],
  ] as const)(
    "rejects unauthenticated %s creation",
    async (_name, handler, request) => {
      mocks.requireEmployer.mockResolvedValue({
        user: null,
        error: "Unauthorized",
        status: 401,
      });

      const response = await handler(request);

      expect(response.status).toBe(401);
      expect(mocks.summary).not.toHaveBeenCalled();
    },
  );

  it("uses only the server-side price and trusted callback origins", async () => {
    const response = await createCheckout(
      checkoutRequest({ plan: "growth", priceId: "price_attacker" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.checkout).toHaveBeenCalledWith({
      customerId: "cus_123",
      priceId: "price_growth_server",
      companyId: "company_123",
      plan: "growth",
      successUrl:
        "https://staging.hiregeneral.com/employers/dashboard/subscription?checkout=success",
      cancelUrl:
        "https://staging.hiregeneral.com/employers/dashboard/subscription?checkout=cancelled",
    });
    expect(mocks.audit).toHaveBeenCalledWith({
      action: "billing.checkout_session_created",
      targetType: "company",
      targetId: "company_123",
      metadata: { plan: "growth", stripe_session_id: "cs_123" },
    });
  });

  it("rejects arbitrary plan values before Stripe access", async () => {
    const response = await createCheckout(
      checkoutRequest({ plan: "enterprise", priceId: "price_attacker" }),
    );

    expect(response.status).toBe(400);
    expect(mocks.checkout).not.toHaveBeenCalled();
  });

  it.each([
    ["checkout", createCheckout, checkoutRequest()],
    ["portal", createPortal, portalRequest()],
  ] as const)("rate limits %s creation", async (_name, handler, request) => {
    mocks.limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 30_000,
    });

    const response = await handler(request);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it.each([
    ["checkout", createCheckout, checkoutRequest()],
    ["portal", createPortal, portalRequest()],
  ] as const)(
    "rejects a Stripe customer not owned by the employer company for %s",
    async (_name, handler, request) => {
      mocks.retrieveCustomer.mockResolvedValue({
        id: "cus_123",
        metadata: { companyId: "company_other" },
      });

      const response = await handler(request);
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload.error).toMatch(/^Could not create/);
      expect(mocks.checkout).not.toHaveBeenCalled();
      expect(mocks.portal).not.toHaveBeenCalled();
    },
  );

  it("creates a portal with a fixed return URL and records an audit event", async () => {
    const response = await createPortal(portalRequest());

    expect(response.status).toBe(200);
    expect(mocks.portal).toHaveBeenCalledWith({
      customerId: "cus_123",
      returnUrl:
        "https://staging.hiregeneral.com/employers/dashboard/subscription",
    });
    expect(mocks.audit).toHaveBeenCalledWith({
      action: "billing.portal_session_created",
      targetType: "company",
      targetId: "company_123",
      metadata: { stripe_session_id: "bps_123" },
    });
  });

  it.each([
    ["checkout", createCheckout, checkoutRequest(), mocks.checkout],
    ["portal", createPortal, portalRequest(), mocks.portal],
  ] as const)(
    "does not expose raw Stripe errors from %s creation",
    async (_name, handler, request, stripeCall) => {
      stripeCall.mockRejectedValue(
        new Error("secret Stripe customer and request diagnostics"),
      );

      const response = await handler(request);
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload.error).toMatch(/^Could not create/);
      expect(JSON.stringify(payload)).not.toContain("secret Stripe");
    },
  );

  it.each([
    ["checkout", createCheckout, checkoutRequest(), mocks.checkout],
    ["portal", createPortal, portalRequest(), mocks.portal],
  ] as const)(
    "rejects an untrusted %s redirect returned by the provider",
    async (_name, handler, request, stripeCall) => {
      stripeCall.mockResolvedValue({
        id: "session_123",
        url: "https://stripe.com.evil.example/phishing",
      });

      const response = await handler(request);

      expect(response.status).toBe(500);
      expect(mocks.audit).not.toHaveBeenCalled();
    },
  );
});
