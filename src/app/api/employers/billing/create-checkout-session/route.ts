import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  BILLING_PLANS,
  getEmployerBillingSummary,
  type BillingPlanKey,
} from "@/employer/dashboard/subscription/employer-billing-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
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

  const parsed = checkoutSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a valid billing plan." },
      { status: 400 },
    );
  }

  const priceId = getPlanPriceId(parsed.data.plan);

  if (!priceId) {
    return NextResponse.json(
      {
        error: `Missing Stripe price id for the ${BILLING_PLANS[parsed.data.plan].name} plan.`,
      },
      { status: 500 },
    );
  }

  try {
    const summary = await getEmployerBillingSummary({
      supabase: auth.supabase,
      recruiterId: auth.user.id,
      email: auth.user.email,
    });

    if (!summary.plan.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            summary.stripeWarning ||
            "Could not prepare a Stripe customer for this company.",
        },
        { status: 500 },
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      request.nextUrl.origin;
    const session = await createStripeCheckoutSession({
      customerId: summary.plan.stripeCustomerId,
      priceId,
      successUrl: `${origin}/employers/dashboard/subscription?checkout=success`,
      cancelUrl: `${origin}/employers/dashboard/subscription?checkout=cancelled`,
      companyId: summary.companyId,
      plan: parsed.data.plan,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create checkout session.",
      },
      { status: 500 },
    );
  }
}
