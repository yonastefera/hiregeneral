import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  cancelStripeSubscription,
  isStripeNotFoundError,
  StripeRequestError,
} from "@/lib/stripe/server";

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_private";
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  vi.unstubAllGlobals();
});

describe("Stripe subscription cancellation", () => {
  it("uses Stripe's DELETE subscription endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "sub_123", status: "canceled" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(cancelStripeSubscription("sub_123")).resolves.toEqual({
      id: "sub_123",
      status: "canceled",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.stripe.com/v1/subscriptions/sub_123");
    expect(init).toEqual(
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test_private",
        }),
      }),
    );
  });

  it("classifies a missing subscription as retry-safe", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ error: { message: "No such subscription" } }),
            { status: 404 },
          ),
        ),
    );

    const error = await cancelStripeSubscription("sub_missing").catch(
      (requestError: unknown) => requestError,
    );

    expect(error).toBeInstanceOf(StripeRequestError);
    expect(isStripeNotFoundError(error)).toBe(true);
  });
});
