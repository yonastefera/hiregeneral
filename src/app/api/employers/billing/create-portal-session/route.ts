import { NextRequest, NextResponse } from "next/server";

import { getEmployerBillingSummary } from "@/employer/dashboard/subscription/employer-billing-data";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";
import { trustedOrigin } from "@/lib/auth/security";
import {
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
import { createStripePortalSession } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limited = await enforceRateLimit({
    limiter: employerBillingRateLimit,
    key: auth.user.id,
    context: "billing_portal_create",
  });
  if (limited) return limited;

  try {
    const summary = await getEmployerBillingSummary({
      supabase: auth.supabase,
      recruiterId: auth.user.id,
      email: auth.user.email,
    });

    if (!summary.plan.stripeCustomerId) {
      logServerError("billing_portal_customer_missing", null);
      return safeServerError("Could not create billing portal session.");
    }

    await assertStripeCustomerOwnership({
      customerId: summary.plan.stripeCustomerId,
      companyId: summary.companyId,
    });

    const origin = trustedOrigin(request.nextUrl.origin);
    const portalSession = await createStripePortalSession({
      customerId: summary.plan.stripeCustomerId,
      returnUrl: `${origin}/employers/dashboard/subscription`,
    });

    if (!isTrustedStripeRedirect(portalSession.url)) {
      logServerError("billing_portal_redirect_invalid", null);
      return safeServerError("Could not create billing portal session.");
    }

    await recordPrivilegedAction({
      action: "billing.portal_session_created",
      targetType: "company",
      targetId: summary.companyId,
      metadata: { stripe_session_id: portalSession.id },
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    logServerError("billing_portal_create_failed", error);
    return safeServerError("Could not create billing portal session.");
  }
}
