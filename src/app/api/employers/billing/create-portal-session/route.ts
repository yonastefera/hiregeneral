import { NextRequest, NextResponse } from "next/server";

import { getEmployerBillingSummary } from "@/employer/dashboard/subscription/employer-billing-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import { createStripePortalSession } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
            "No Stripe customer is attached to this company yet.",
        },
        { status: 500 },
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      request.nextUrl.origin;
    const portalSession = await createStripePortalSession({
      customerId: summary.plan.stripeCustomerId,
      returnUrl: `${origin}/employers/dashboard/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create billing portal session.",
      },
      { status: 500 },
    );
  }
}
