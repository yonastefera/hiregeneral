import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.admin,
}));

vi.mock("@/lib/stripe/server", () => ({
  verifyStripeWebhookEvent: mocks.verify,
}));

vi.mock("@/employer/dashboard/subscription/employer-billing-data", () => ({
  BILLING_PLANS: {
    starter: { activeJobLimit: 3 },
    growth: { activeJobLimit: 10 },
    pro: { activeJobLimit: 25 },
  },
  normalizeBillingPlan: (value: string | null) => value ?? "starter",
}));

import { POST } from "@/app/api/webhooks/stripe/route";

function request() {
  return new NextRequest("https://hiregeneral.test/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "signed" },
    body: "{}",
  });
}

function event(type = "unhandled.event") {
  return {
    id: "evt_123",
    type,
    data: { object: {} },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.verify.mockReturnValue(event());
});

describe("POST /api/webhooks/stripe", () => {
  it("rejects an invalid signature before claiming an event", async () => {
    const rpc = vi.fn();
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

  it("does not process an event another request already claimed", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    mocks.admin.mockReturnValue({ rpc });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("claim_billing_event", {
      p_stripe_event_id: "evt_123",
      p_event_type: "unhandled.event",
    });
  });

  it("claims and completes an event around processing", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: "claim_123", error: null })
      .mockResolvedValueOnce({ data: true, error: null });
    mocks.admin.mockReturnValue({ rpc });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(rpc.mock.calls).toEqual([
      [
        "claim_billing_event",
        {
          p_stripe_event_id: "evt_123",
          p_event_type: "unhandled.event",
        },
      ],
      [
        "finish_billing_event",
        {
          p_claim_token: "claim_123",
          p_stripe_event_id: "evt_123",
          p_status: "completed",
        },
      ],
    ]);
  });

  it("marks a claimed event failed so Stripe can retry it", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: "claim_123", error: null })
      .mockResolvedValueOnce({ data: true, error: null });
    const updateQuery = {
      update: vi.fn(),
      eq: vi.fn().mockResolvedValue({
        error: { message: "private database failure" },
      }),
    };
    updateQuery.update.mockReturnValue(updateQuery);
    mocks.admin.mockReturnValue({
      rpc,
      from: vi.fn().mockReturnValue(updateQuery),
    });
    mocks.verify.mockReturnValue({
      ...event("invoice.payment_failed"),
      data: { object: { customer: "cus_123" } },
    });

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Could not process Stripe webhook.",
    });
    expect(rpc).toHaveBeenLastCalledWith("finish_billing_event", {
      p_claim_token: "claim_123",
      p_stripe_event_id: "evt_123",
      p_status: "failed",
    });
  });
});
