import { NextRequest, NextResponse } from "next/server";

import {
  BILLING_PLANS,
  normalizeBillingPlan,
} from "@/employer/dashboard/subscription/employer-billing-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordPrivilegedAction } from "@/lib/security/audit";
import {
  boundedTextBody,
  JSON_BODY_LIMITS,
  logServerError,
} from "@/lib/http/api-security";
import {
  verifyStripeWebhookEvent,
  retrieveStripeCharge,
  type StripeEvent,
} from "@/lib/stripe/server";

export const runtime = "nodejs";

function getString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function getMetadata(object: Record<string, unknown>) {
  return object.metadata && typeof object.metadata === "object"
    ? (object.metadata as Record<string, string>)
    : {};
}

function unixToIso(value: unknown) {
  const seconds = getNumber(value);

  if (!seconds) return null;

  return new Date(seconds * 1000).toISOString();
}

async function claimEvent(event: StripeEvent) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("claim_billing_event", {
    p_stripe_event_id: event.id,
    p_event_type: event.type,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function finishEvent(
  eventId: string,
  claimToken: string,
  status: "completed" | "failed",
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("finish_billing_event", {
    p_stripe_event_id: eventId,
    p_claim_token: claimToken,
    p_status: status,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateCompanySubscription(params: {
  eventCreated: number;
  companyId: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  plan: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const planKey = params.plan ? normalizeBillingPlan(params.plan) : null;
  const { error } = await supabase.rpc("apply_company_billing_event", {
    p_company_id: params.companyId,
    p_customer_id: params.customerId,
    p_subscription_id: params.subscriptionId,
    p_plan: planKey,
    p_status: params.status,
    p_current_period_end: params.currentPeriodEnd,
    p_active_job_limit: planKey ? BILLING_PLANS[planKey].activeJobLimit : null,
    p_event_created: params.eventCreated,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function handleCheckoutCompleted(
  object: Record<string, unknown>,
  eventCreated: number,
) {
  const metadata = getMetadata(object);
  const companyId = metadata.companyId ?? null;
  const customerId = getString(object.customer);
  const subscriptionId = getString(object.subscription);

  if (!companyId || !customerId || !subscriptionId) {
    throw new Error("Checkout session is missing billing ownership fields.");
  }

  await updateCompanySubscription({
    eventCreated,
    companyId,
    customerId,
    subscriptionId,
    plan: metadata.plan ?? null,
    status: "active",
    currentPeriodEnd: null,
  });
}

async function handleSubscriptionChange(
  object: Record<string, unknown>,
  eventCreated: number,
) {
  const metadata = getMetadata(object);
  const status = getString(object.status) || "inactive";
  const currentPeriodEnd = unixToIso(object.current_period_end);

  await updateCompanySubscription({
    eventCreated,
    companyId: metadata.companyId ?? null,
    customerId: getString(object.customer),
    subscriptionId: getString(object.id),
    plan: status === "canceled" ? "starter" : (metadata.plan ?? null),
    status,
    currentPeriodEnd,
  });
}

function getInvoiceDescription(object: Record<string, unknown>) {
  const lines = object.lines as
    | { data?: Array<{ description?: string | null }> }
    | undefined;

  return lines?.data?.[0]?.description || "HireGeneral billing";
}

function getInvoicePaidAt(object: Record<string, unknown>) {
  const transitions =
    object.status_transitions && typeof object.status_transitions === "object"
      ? (object.status_transitions as Record<string, unknown>)
      : null;

  return unixToIso(transitions?.paid_at);
}

async function handleInvoicePaid(object: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  const customerId = getString(object.customer);

  if (!customerId) return;

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (companyError) {
    throw new Error(companyError.message);
  }

  if (!company?.id) return;

  const invoiceId = getString(object.id);

  if (!invoiceId) return;

  const { error } = await supabase.from("billing_receipts").upsert(
    {
      company_id: company.id,
      stripe_invoice_id: invoiceId,
      invoice_number: getString(object.number),
      invoice_pdf_url: getString(object.invoice_pdf),
      hosted_invoice_url: getString(object.hosted_invoice_url),
      amount_paid_cents: getNumber(object.amount_paid) ?? 0,
      currency: getString(object.currency) || "usd",
      description: getInvoiceDescription(object),
      paid_at: getInvoicePaidAt(object),
    },
    { onConflict: "stripe_invoice_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function handleInvoicePaymentFailed(
  object: Record<string, unknown>,
  eventCreated: number,
) {
  const customerId = getString(object.customer);

  if (!customerId) return;

  await updateCompanySubscription({
    eventCreated,
    companyId: null,
    customerId,
    subscriptionId: getString(object.subscription),
    plan: null,
    status: "past_due",
    currentPeriodEnd: null,
  });
}

async function companyIdForCustomer(customerId: string | null) {
  if (!customerId) return null;

  const { data, error } = await createSupabaseAdminClient()
    .from("companies")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function handleBillingRiskEvent(
  event: StripeEvent,
  object: Record<string, unknown>,
) {
  let customerId = getString(object.customer);

  if (!customerId) {
    const chargeId = getString(object.charge);
    if (chargeId) customerId = (await retrieveStripeCharge(chargeId)).customer;
  }

  const companyId = await companyIdForCustomer(customerId);
  const objectId = getString(object.id) ?? event.id;

  await recordPrivilegedAction({
    action: `billing.${event.type}`,
    targetType: event.type.startsWith("charge.dispute")
      ? "stripe_dispute"
      : "stripe_charge",
    targetId: objectId,
    metadata: {
      company_id: companyId,
      customer_id: customerId,
      status: getString(object.status),
      reason: getString(object.reason),
      amount: getNumber(object.amount),
      currency: getString(object.currency),
    },
  });
}

async function processStripeEvent(event: StripeEvent) {
  const eventCreated = getNumber(event.created);

  if (!eventCreated || eventCreated <= 0) {
    throw new Error("Stripe event is missing its creation timestamp.");
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, eventCreated);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionChange(event.data.object, eventCreated);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object, eventCreated);
      break;
    case "charge.refunded":
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
    case "charge.dispute.funds_withdrawn":
    case "charge.dispute.funds_reinstated":
      await handleBillingRiskEvent(event, event.data.object);
      break;
    default:
      break;
  }
}

export async function POST(request: NextRequest) {
  const body = await boundedTextBody(request, JSON_BODY_LIMITS.webhook);
  if (!body.ok) return body.response;

  let event: StripeEvent;

  try {
    event = verifyStripeWebhookEvent({
      payload: body.data,
      signatureHeader: request.headers.get("stripe-signature"),
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    });
  } catch (error) {
    logServerError("stripe_webhook_verification_failed", error);
    return NextResponse.json(
      { error: "Could not verify Stripe webhook." },
      { status: 400 },
    );
  }

  let claimToken: string;

  try {
    const claimed = await claimEvent(event);
    if (!claimed) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    claimToken = claimed;
  } catch (error) {
    logServerError("stripe_webhook_claim_failed", error);
    return NextResponse.json(
      { error: "Could not process Stripe webhook." },
      { status: 500 },
    );
  }

  try {
    await processStripeEvent(event);
    await finishEvent(event.id, claimToken, "completed");

    return NextResponse.json({ received: true });
  } catch (error) {
    logServerError("stripe_webhook_processing_failed", error);

    try {
      await finishEvent(event.id, claimToken, "failed");
    } catch (finishError) {
      logServerError("stripe_webhook_failure_record_failed", finishError);
    }

    return NextResponse.json(
      { error: "Could not process Stripe webhook." },
      { status: 500 },
    );
  }
}
