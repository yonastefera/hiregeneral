import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getEmployerBillingSummary,
  type BillingPlanKey,
} from "@/employer/dashboard/subscription/employer-billing-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import { trustedOrigin } from "@/lib/auth/security";
import {
  boundedJsonBody,
  enforceRateLimit,
  logServerError,
  safeServerError,
} from "@/lib/http/api-security";
import { employerBillingRateLimit } from "@/lib/rate-limit";
import { recordPrivilegedAction } from "@/lib/security/audit";
import {
  assertStripeCustomerOwnership,
  isTrustedStripeRedirect,
} from "@/lib/stripe/ownership";
import { createStripeCheckoutSession } from "@/lib/stripe/server";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  plan: z.enum(["growth", "pro"]),
});

function getPlanPriceId(plan: BillingPlanKey) {
  if (plan === "growth") return process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID;
  if (plan === "pro") return process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  return null;
}

export async function POST(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limited = await enforceRateLimit({
    limiter: employerBillingRateLimit,
    key: auth.user.id,
    context: "billing_checkout_create",
  });
  if (limited) return limited;

  const body = await boundedJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = checkoutSchema.safeParse(body.data);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a valid billing plan." },
      { status: 400 },
    );
  }

  const priceId = getPlanPriceId(parsed.data.plan);

  if (!priceId) {
    logServerError("billing_checkout_price_missing", null);
    return safeServerError("Could not create checkout session.");
  }

  try {
    const summary = await getEmployerBillingSummary({
      supabase: auth.supabase,
      recruiterId: auth.user.id,
      email: auth.user.email,
    });

    if (!summary.plan.stripeCustomerId) {
      logServerError("billing_checkout_customer_missing", null);
      return safeServerError("Could not create checkout session.");
    }

    await assertStripeCustomerOwnership({
      customerId: summary.plan.stripeCustomerId,
      companyId: summary.companyId,
    });

    const origin = trustedOrigin(request.nextUrl.origin);
    const session = await createStripeCheckoutSession({
      customerId: summary.plan.stripeCustomerId,
      priceId,
      successUrl: `${origin}/employers/dashboard/subscription?checkout=success`,
      cancelUrl: `${origin}/employers/dashboard/subscription?checkout=cancelled`,
      companyId: summary.companyId,
      plan: parsed.data.plan,
    });

    if (!isTrustedStripeRedirect(session.url)) {
      logServerError("billing_checkout_redirect_invalid", null);
      return safeServerError("Could not create checkout session.");
    }

    await recordPrivilegedAction({
      action: "billing.checkout_session_created",
      targetType: "company",
      targetId: summary.companyId,
      metadata: {
        plan: parsed.data.plan,
        stripe_session_id: session.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logServerError("billing_checkout_create_failed", error);
    return safeServerError("Could not create checkout session.");
  }
}
