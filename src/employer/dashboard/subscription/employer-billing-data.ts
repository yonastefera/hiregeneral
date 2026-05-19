import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  createStripeCustomer,
  isStripeConfigured,
  listStripePaymentMethods,
} from "@/lib/stripe/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type BillingPlanKey = "starter" | "growth" | "pro";

export type BillingReceipt = {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amountCents: number;
  currency: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
};

export type PaymentMethodSummary = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isPrimary: boolean;
};

export type EmployerBillingSummary = {
  configured: boolean;
  companyId: string;
  companyName: string;
  stripeWarning: string | null;
  plan: {
    key: BillingPlanKey;
    name: string;
    status: string;
    priceCents: number;
    currency: string;
    renewsAt: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  };
  usage: {
    activeJobs: number;
    activeJobLimit: number;
    accountCreditCents: number;
    boostCredits: number;
    discountLabel: string;
  };
  paymentMethods: PaymentMethodSummary[];
  receipts: BillingReceipt[];
};

type CompanyBillingRow = {
  id: string;
  name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_plan: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  active_job_limit: number | null;
  account_credit_cents: number | null;
  boost_credits: number | null;
  billing_email: string | null;
};

type ReceiptRow = {
  id: string;
  stripe_invoice_id: string;
  invoice_number: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  amount_paid_cents: number;
  currency: string;
  description: string | null;
  paid_at: string | null;
  created_at: string;
};

const BILLING_SCHEMA_WARNING =
  "Billing database fields are not installed yet. Run src/lib/migrations/file46.sql in Supabase, then refresh this page.";

export const BILLING_PLANS: Record<
  BillingPlanKey,
  {
    name: string;
    priceCents: number;
    currency: string;
    activeJobLimit: number;
    discountLabel: string;
  }
> = {
  starter: {
    name: "Starter",
    priceCents: 0,
    currency: "usd",
    activeJobLimit: 3,
    discountLabel: "None",
  },
  growth: {
    name: "Growth",
    priceCents: 29900,
    currency: "usd",
    activeJobLimit: 25,
    discountLabel: "Monthly",
  },
  pro: {
    name: "Pro",
    priceCents: 59900,
    currency: "usd",
    activeJobLimit: 100,
    discountLabel: "Priority hiring",
  },
};

export function normalizeBillingPlan(value: string | null | undefined) {
  if (value === "growth" || value === "pro") return value;
  return "starter";
}

function formatCompanyName(email: string | null | undefined) {
  const fallback = email?.split("@")[1]?.split(".")[0] || "Your company";

  return fallback
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function formatInvoiceDate(value: string | null | undefined) {
  if (!value) return "Today";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Today";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isMissingBillingSchemaError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    message.includes("stripe_customer_id") ||
    message.includes("billing_receipts") ||
    message.includes("billing_events") ||
    message.includes("job_boosts")
  );
}

function toStarterCompany(row: {
  id: string;
  name: string;
}): CompanyBillingRow {
  return {
    id: row.id,
    name: row.name,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    billing_plan: "starter",
    subscription_status: "inactive",
    current_period_end: null,
    active_job_limit: BILLING_PLANS.starter.activeJobLimit,
    account_credit_cents: 0,
    boost_credits: 0,
    billing_email: null,
  };
}

async function ensureEmployerCompanyWithoutBillingSchema(params: {
  supabase: SupabaseServerClient;
  recruiterId: string;
  email: string | null | undefined;
}) {
  const companyResult = await params.supabase
    .from("companies")
    .select("id, name")
    .eq("owner_id", params.recruiterId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (companyResult.error) {
    throw new Error(companyResult.error.message);
  }

  if (companyResult.data) {
    return toStarterCompany(companyResult.data);
  }

  const createdResult = await params.supabase
    .from("companies")
    .insert({
      owner_id: params.recruiterId,
      name: formatCompanyName(params.email),
    })
    .select("id, name")
    .single();

  if (createdResult.error || !createdResult.data) {
    throw new Error(
      createdResult.error?.message ?? "Could not create company.",
    );
  }

  return toStarterCompany(createdResult.data);
}

async function ensureEmployerCompany(params: {
  supabase: SupabaseServerClient;
  recruiterId: string;
  email: string | null | undefined;
}) {
  const companyResult = await params.supabase
    .from("companies")
    .select(
      `
      id,
      name,
      stripe_customer_id,
      stripe_subscription_id,
      billing_plan,
      subscription_status,
      current_period_end,
      active_job_limit,
      account_credit_cents,
      boost_credits,
      billing_email
    `,
    )
    .eq("owner_id", params.recruiterId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (companyResult.error && isMissingBillingSchemaError(companyResult.error)) {
    return {
      company: await ensureEmployerCompanyWithoutBillingSchema(params),
      billingSchemaReady: false,
    };
  }

  if (companyResult.error) {
    throw new Error(companyResult.error.message);
  }

  if (companyResult.data) {
    return {
      company: companyResult.data as CompanyBillingRow,
      billingSchemaReady: true,
    };
  }

  const companyName = formatCompanyName(params.email);
  const createdResult = await params.supabase
    .from("companies")
    .insert({
      owner_id: params.recruiterId,
      name: companyName,
      billing_email: params.email ?? null,
      billing_plan: "starter",
      subscription_status: "inactive",
      active_job_limit: BILLING_PLANS.starter.activeJobLimit,
    })
    .select(
      `
      id,
      name,
      stripe_customer_id,
      stripe_subscription_id,
      billing_plan,
      subscription_status,
      current_period_end,
      active_job_limit,
      account_credit_cents,
      boost_credits,
      billing_email
    `,
    )
    .single();

  if (createdResult.error || !createdResult.data) {
    throw new Error(
      createdResult.error?.message ?? "Could not create company.",
    );
  }

  return {
    company: createdResult.data as CompanyBillingRow,
    billingSchemaReady: true,
  };
}

async function ensureStripeCustomer(params: {
  supabase: SupabaseServerClient;
  company: CompanyBillingRow;
  email: string | null | undefined;
}) {
  if (params.company.stripe_customer_id || !isStripeConfigured()) {
    return {
      stripeCustomerId: params.company.stripe_customer_id,
      warning: isStripeConfigured() ? null : "Stripe is not configured yet.",
    };
  }

  try {
    const customer = await createStripeCustomer({
      email: params.email ?? params.company.billing_email,
      name: params.company.name,
      companyId: params.company.id,
    });

    await params.supabase
      .from("companies")
      .update({
        stripe_customer_id: customer.id,
        billing_email: params.email ?? params.company.billing_email,
      })
      .eq("id", params.company.id);

    return { stripeCustomerId: customer.id, warning: null };
  } catch (error) {
    return {
      stripeCustomerId: null,
      warning:
        error instanceof Error
          ? error.message
          : "Could not create Stripe customer.",
    };
  }
}

async function loadPaymentMethods(customerId: string | null) {
  if (!customerId || !isStripeConfigured()) return [];

  try {
    const methods = await listStripePaymentMethods(customerId);

    return methods.map((method, index) => ({
      ...method,
      isPrimary: index === 0,
    }));
  } catch {
    return [];
  }
}

export async function getEmployerBillingSummary(params: {
  supabase?: SupabaseServerClient;
  recruiterId: string;
  email?: string | null;
}) {
  const supabase = params.supabase ?? (await createClient());
  const companyResult = await ensureEmployerCompany({
    supabase,
    recruiterId: params.recruiterId,
    email: params.email,
  });
  const { company, billingSchemaReady } = companyResult;
  const customer = billingSchemaReady
    ? await ensureStripeCustomer({
        supabase,
        company,
        email: params.email,
      })
    : { stripeCustomerId: null, warning: BILLING_SCHEMA_WARNING };
  const planKey = normalizeBillingPlan(company.billing_plan);
  const plan = BILLING_PLANS[planKey];

  const [activeJobsResult, receiptsResult, paymentMethods] = await Promise.all([
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("recruiter_id", params.recruiterId)
      .eq("status", "published"),
    billingSchemaReady
      ? supabase
          .from("billing_receipts")
          .select(
            `
            id,
            stripe_invoice_id,
            invoice_number,
            invoice_pdf_url,
            hosted_invoice_url,
            amount_paid_cents,
            currency,
            description,
            paid_at,
            created_at
          `,
          )
          .eq("company_id", company.id)
          .order("paid_at", { ascending: false, nullsFirst: false })
          .limit(8)
      : Promise.resolve({ data: [], error: null }),
    loadPaymentMethods(customer.stripeCustomerId),
  ]);

  if (activeJobsResult.error) {
    throw new Error(activeJobsResult.error.message);
  }

  if (
    receiptsResult.error &&
    !isMissingBillingSchemaError(receiptsResult.error)
  ) {
    throw new Error(receiptsResult.error.message);
  }

  const receipts = ((receiptsResult.data ?? []) as ReceiptRow[]).map(
    (receipt) => ({
      id: receipt.id,
      invoiceNumber:
        receipt.invoice_number || receipt.stripe_invoice_id.slice(-10),
      date: formatInvoiceDate(receipt.paid_at || receipt.created_at),
      description: receipt.description || `${plan.name} plan`,
      amountCents: receipt.amount_paid_cents,
      currency: receipt.currency,
      pdfUrl: receipt.invoice_pdf_url,
      hostedUrl: receipt.hosted_invoice_url,
    }),
  );

  return {
    configured: billingSchemaReady && isStripeConfigured(),
    companyId: company.id,
    companyName: company.name,
    stripeWarning: customer.warning,
    plan: {
      key: planKey,
      name: plan.name,
      status: company.subscription_status || "inactive",
      priceCents: plan.priceCents,
      currency: plan.currency,
      renewsAt: company.current_period_end,
      stripeCustomerId: customer.stripeCustomerId,
      stripeSubscriptionId: company.stripe_subscription_id,
    },
    usage: {
      activeJobs: activeJobsResult.count ?? 0,
      activeJobLimit: company.active_job_limit ?? plan.activeJobLimit,
      accountCreditCents: company.account_credit_cents ?? 0,
      boostCredits: company.boost_credits ?? 0,
      discountLabel: plan.discountLabel,
    },
    paymentMethods,
    receipts,
  } satisfies EmployerBillingSummary;
}
