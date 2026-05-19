import { NextRequest, NextResponse } from "next/server";

import {
  BILLING_PLANS,
  normalizeBillingPlan,
} from "@/employer/dashboard/subscription/employer-billing-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  verifyStripeWebhookEvent,
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

async function markProcessed(event: StripeEvent) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("billing_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

async function alreadyProcessed(eventId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("billing_events")
    .select("id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function updateCompanySubscription(params: {
  companyId: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  plan: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const planKey = normalizeBillingPlan(params.plan);
  const plan = BILLING_PLANS[planKey];
  const values = {
    stripe_customer_id: params.customerId,
    stripe_subscription_id: params.subscriptionId,
    billing_plan: planKey,
    subscription_status: params.status || "inactive",
    current_period_end: params.currentPeriodEnd,
    active_job_limit: plan.activeJobLimit,
  };

  const query = supabase.from("companies").update(values);
  const result = params.companyId
    ? await query.eq("id", params.companyId)
    : params.customerId
      ? await query.eq("stripe_customer_id", params.customerId)
      : { error: null };

  if (result.error) {
    throw new Error(result.error.message);
  }
}

async function handleCheckoutCompleted(object: Record<string, unknown>) {
  const metadata = getMetadata(object);

  await updateCompanySubscription({
    companyId: metadata.companyId ?? null,
    customerId: getString(object.customer),
    subscriptionId: getString(object.subscription),
    plan: metadata.plan ?? null,
    status: "active",
    currentPeriodEnd: null,
  });
}

async function handleSubscriptionChange(object: Record<string, unknown>) {
  const metadata = getMetadata(object);
  const status = getString(object.status) || "inactive";
  const currentPeriodEnd = unixToIso(object.current_period_end);

  await updateCompanySubscription({
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

async function handleInvoicePaymentFailed(object: Record<string, unknown>) {
  const customerId = getString(object.customer);

  if (!customerId) return;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("companies")
    .update({
      subscription_status: "past_due",
      stripe_subscription_id: getString(object.subscription),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    throw new Error(error.message);
  }
}

async function processStripeEvent(event: StripeEvent) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionChange(event.data.object);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      break;
  }
}

export async function POST(request: NextRequest) {
  let event: StripeEvent;

  try {
    const payload = await request.text();
    event = verifyStripeWebhookEvent({
      payload,
      signatureHeader: request.headers.get("stripe-signature"),
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    });

    if (await alreadyProcessed(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await processStripeEvent(event);
    await markProcessed(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not process Stripe webhook.",
      },
      { status: 400 },
    );
  }
}
