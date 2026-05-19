import "server-only";

import crypto from "node:crypto";

const STRIPE_BASE_URL = "https://api.stripe.com/v1";
const WEBHOOK_TOLERANCE_SECONDS = 300;

type StripeFormValue = string | number | boolean | null | undefined;
type StripeFormFields = Record<string, StripeFormValue>;

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  customer: string | null;
  subscription: string | null;
  payment_intent: string | null;
  metadata?: Record<string, string>;
};

export type StripeCustomer = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export type StripePaymentMethodSummary = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

export function isStripeConfigured() {
  return Boolean(getStripeSecretKey());
}

function encodeForm(fields: StripeFormFields) {
  const form = new URLSearchParams();

  Object.entries(fields).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    form.append(key, String(value));
  });

  return form;
}

async function stripeRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    fields?: StripeFormFields;
  } = {},
) {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  const method = options.method ?? "POST";
  const url = new URL(`${STRIPE_BASE_URL}${path}`);
  const body = method === "POST" ? encodeForm(options.fields ?? {}) : undefined;

  if (method === "GET") {
    const params = encodeForm(options.fields ?? {});
    params.forEach((value, key) => url.searchParams.append(key, value));
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error?.message
        : `Stripe request failed with ${response.status}.`;

    throw new Error(
      message || `Stripe request failed with ${response.status}.`,
    );
  }

  return payload as T;
}

export async function createStripeCustomer(params: {
  email: string | null | undefined;
  name: string;
  companyId: string;
}) {
  return stripeRequest<StripeCustomer>("/customers", {
    fields: {
      email: params.email || undefined,
      name: params.name,
      "metadata[companyId]": params.companyId,
    },
  });
}

export async function createStripeCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  companyId: string;
  plan: string;
}) {
  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    fields: {
      mode: "subscription",
      customer: params.customerId,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      "line_items[0][price]": params.priceId,
      "line_items[0][quantity]": 1,
      "metadata[companyId]": params.companyId,
      "metadata[plan]": params.plan,
      "subscription_data[metadata][companyId]": params.companyId,
      "subscription_data[metadata][plan]": params.plan,
    },
  });
}

export async function createStripePortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  return stripeRequest<{ id: string; url: string }>(
    "/billing_portal/sessions",
    {
      fields: {
        customer: params.customerId,
        return_url: params.returnUrl,
      },
    },
  );
}

export async function listStripePaymentMethods(customerId: string) {
  const response = await stripeRequest<{
    data?: Array<{
      id: string;
      card?: {
        brand?: string;
        last4?: string;
        exp_month?: number;
        exp_year?: number;
      };
    }>;
  }>("/payment_methods", {
    method: "GET",
    fields: {
      customer: customerId,
      type: "card",
      limit: 4,
    },
  });

  return (response.data ?? [])
    .map((method) => {
      if (!method.card?.last4) return null;

      return {
        id: method.id,
        brand: method.card.brand || "card",
        last4: method.card.last4,
        expMonth: method.card.exp_month ?? 0,
        expYear: method.card.exp_year ?? 0,
      } satisfies StripePaymentMethodSummary;
    })
    .filter((method): method is StripePaymentMethodSummary => Boolean(method));
}

function parseStripeSignature(header: string) {
  return header.split(",").reduce(
    (accumulator, part) => {
      const [key, value] = part.split("=");

      if (key === "t") {
        accumulator.timestamp = value;
      }

      if (key === "v1" && value) {
        accumulator.signatures.push(value);
      }

      return accumulator;
    },
    { timestamp: "", signatures: [] as string[] },
  );
}

export function verifyStripeWebhookEvent(params: {
  payload: string;
  signatureHeader: string | null;
  webhookSecret: string | undefined;
}) {
  if (!params.webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
  }

  if (!params.signatureHeader) {
    throw new Error("Missing Stripe signature header.");
  }

  const { timestamp, signatures } = parseStripeSignature(
    params.signatureHeader,
  );
  const timestampSeconds = Number(timestamp);

  if (!timestampSeconds || signatures.length === 0) {
    throw new Error("Malformed Stripe signature header.");
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);

  if (ageSeconds > WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error(
      "Stripe webhook timestamp is outside the tolerance window.",
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", params.webhookSecret)
    .update(`${timestamp}.${params.payload}`, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const verified = signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature);

    return (
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    );
  });

  if (!verified) {
    throw new Error("Stripe webhook signature verification failed.");
  }

  return JSON.parse(params.payload) as StripeEvent;
}
