import { retrieveStripeCustomer } from "@/lib/stripe/server";

export async function assertStripeCustomerOwnership(params: {
  customerId: string;
  companyId: string;
}) {
  const customer = await retrieveStripeCustomer(params.customerId);

  if (
    customer.id !== params.customerId ||
    customer.metadata?.companyId !== params.companyId
  ) {
    throw new Error("Stripe customer ownership verification failed.");
  }

  return customer;
}

export function isTrustedStripeRedirect(value: string | null | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "stripe.com" || url.hostname.endsWith(".stripe.com"))
    );
  } catch {
    return false;
  }
}
