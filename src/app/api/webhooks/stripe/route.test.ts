import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  audit: vi.fn(),
  retrieveCharge: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.admin,
}));

vi.mock("@/lib/security/audit", () => ({
  recordPrivilegedAction: mocks.audit,
}));

vi.mock("@/lib/stripe/server", () => ({
  retrieveStripeCharge: mocks.retrieveCharge,
  verifyStripeWebhookEvent: mocks.verify,
}));

vi.mock("@/employer/dashboard/subscription/employer-billing-data", () => ({
  BILLING_PLANS: {
    starter: { activeJobLimit: 3 },
    growth: { activeJobLimit: 10 },
    pro: { activeJobLimit: 25 },
  },
  normalizeBillingPlan: (value: string | null) =>
    value === "growth" || value === "pro" ? value : "starter",
}));

import { POST } from "@/app/api/webhooks/stripe/route";

const eventCreated = 1_800_000_000;

function request(body = "{}") {
  return new NextRequest("https://hiregeneral.test/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "signed" },
    body,
  });
}

function event(type = "unhandled.event", object: Record<string, unknown> = {}) {
  return {
    id: "evt_123",
    type,
    created: eventCreated,
    data: { object },
  };
}

function successfulRpc() {
  return vi.fn(async (name: string) => {
    if (name === "claim_billing_event") {
      return { data: "claim_123", error: null };
    }

    return { data: true, error: null };
  });
}

function companyLookup(companyId = "company_123") {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: companyId ? { id: companyId } : null,
      error: null,
    }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.verify.mockReturnValue(event());
  mocks.audit.mockResolvedValue(undefined);
  mocks.retrieveCharge.mockResolvedValue({
    id: "ch_123",
    customer: "cus_123",
  });
});

describe("POST /api/webhooks/stripe", () => {
  it("verifies the exact raw request body before claiming an event", async () => {
    const rpc = successfulRpc();
    mocks.admin.mockReturnValue({ rpc });
    const rawBody = '{"id":"evt_123", "spacing":"preserved"}';

    const response = await POST(request(rawBody));

    expect(response.status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: rawBody,
        signatureHeader: "signed",
      }),
    );
  });

  it("rejects an invalid signature before claiming an event", async () => {
    const rpc = successfulRpc();
    mocks.admin.mockReturnValue({ rpc });
    mocks.verify.mockImplementation(() => {
      throw new Error("invalid signature detail");
    });

    const response = await POST(request());

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({
      error: "Could not verify Stripe webhook.",
    });
  });

  it("does not replay an event another request already claimed", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    mocks.admin.mockReturnValue({ rpc });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
    expect(rpc).toHaveBeenCalledOnce();
  });

  it("safely acknowledges and records an unknown event type", async () => {
    const rpc = successfulRpc();
    mocks.admin.mockReturnValue({ rpc });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(rpc.mock.calls.map(([name]) => name)).toEqual([
      "claim_billing_event",
      "finish_billing_event",
    ]);
  });

  it("passes event time to the atomic apply RPC so older events are ignored", async () => {
    const rpc = successfulRpc();
    mocks.admin.mockReturnValue({ rpc });
    mocks.verify.mockReturnValue(
      event("customer.subscription.updated", {
        id: "sub_123",
        customer: "cus_123",
        status: "active",
        current_period_end: 1_900_000_000,
        metadata: { companyId: "company_123", plan: "growth" },
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("apply_company_billing_event", {
      p_active_job_limit: 10,
      p_company_id: "company_123",
      p_current_period_end: new Date(1_900_000_000 * 1000).toISOString(),
      p_customer_id: "cus_123",
      p_event_created: eventCreated,
      p_plan: "growth",
      p_status: "active",
      p_subscription_id: "sub_123",
    });
  });

  it("downgrades a canceled subscription to starter", async () => {
    const rpc = successfulRpc();
    mocks.admin.mockReturnValue({ rpc });
    mocks.verify.mockReturnValue(
      event("customer.subscription.deleted", {
        id: "sub_123",
        customer: "cus_123",
        status: "canceled",
        metadata: { companyId: "company_123", plan: "pro" },
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "apply_company_billing_event",
      expect.objectContaining({
        p_plan: "starter",
        p_status: "canceled",
        p_active_job_limit: 3,
      }),
    );
  });

  it("marks payment failure past due without changing the plan", async () => {
    const rpc = successfulRpc();
    mocks.admin.mockReturnValue({ rpc });
    mocks.verify.mockReturnValue(
      event("invoice.payment_failed", {
        customer: "cus_123",
        subscription: "sub_123",
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "apply_company_billing_event",
      expect.objectContaining({
        p_customer_id: "cus_123",
        p_plan: null,
        p_status: "past_due",
      }),
    );
  });

  it("restores active status from a newer subscription update", async () => {
    const rpc = successfulRpc();
    mocks.admin.mockReturnValue({ rpc });
    mocks.verify.mockReturnValue(
      event("customer.subscription.updated", {
        id: "sub_123",
        customer: "cus_123",
        status: "active",
        metadata: { companyId: "company_123", plan: "pro" },
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "apply_company_billing_event",
      expect.objectContaining({ p_plan: "pro", p_status: "active" }),
    );
  });

  it("requires checkout customer, subscription, and company ownership fields", async () => {
    const rpc = successfulRpc();
    mocks.admin.mockReturnValue({ rpc });
    mocks.verify.mockReturnValue(
      event("checkout.session.completed", {
        customer: "cus_123",
        metadata: { companyId: "company_123", plan: "growth" },
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(rpc).not.toHaveBeenCalledWith(
      "apply_company_billing_event",
      expect.anything(),
    );
    expect(rpc).toHaveBeenLastCalledWith("finish_billing_event", {
      p_claim_token: "claim_123",
      p_stripe_event_id: "evt_123",
      p_status: "failed",
    });
  });

  it("rejects a customer-to-company mismatch reported by the atomic RPC", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "claim_billing_event") {
        return { data: "claim_123", error: null };
      }
      if (name === "apply_company_billing_event") {
        return {
          data: null,
          error: { message: "Stripe customer does not belong to company" },
        };
      }
      return { data: true, error: null };
    });
    mocks.admin.mockReturnValue({ rpc });
    mocks.verify.mockReturnValue(
      event("checkout.session.completed", {
        customer: "cus_wrong",
        subscription: "sub_123",
        metadata: { companyId: "company_123", plan: "growth" },
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Could not process Stripe webhook.",
    });
  });

  it("audits refunds without silently changing subscription state", async () => {
    const rpc = successfulRpc();
    const query = companyLookup();
    mocks.admin.mockReturnValue({ rpc, from: vi.fn().mockReturnValue(query) });
    mocks.verify.mockReturnValue(
      event("charge.refunded", {
        id: "ch_123",
        customer: "cus_123",
        amount: 29900,
        currency: "usd",
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "billing.charge.refunded",
        targetType: "stripe_charge",
        targetId: "ch_123",
      }),
    );
    expect(rpc).not.toHaveBeenCalledWith(
      "apply_company_billing_event",
      expect.anything(),
    );
  });

  it("resolves and audits dispute ownership through its Stripe charge", async () => {
    const rpc = successfulRpc();
    const query = companyLookup();
    mocks.admin.mockReturnValue({ rpc, from: vi.fn().mockReturnValue(query) });
    mocks.verify.mockReturnValue(
      event("charge.dispute.created", {
        id: "dp_123",
        charge: "ch_123",
        amount: 29900,
        currency: "usd",
        reason: "fraudulent",
        status: "needs_response",
      }),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.retrieveCharge).toHaveBeenCalledWith("ch_123");
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "billing.charge.dispute.created",
        targetType: "stripe_dispute",
        targetId: "dp_123",
      }),
    );
  });
});
