import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getEmployerBillingSummary } from "@/employer/dashboard/subscription/employer-billing-data";
import { SubscriptionPage } from "@/employer/dashboard/subscription/SubscriptionPage";
import { requireEmployerUser } from "@/lib/auth/require-employer-user";

export const metadata: Metadata = {
  title: "Subscription & Billing — HireGeneral",
  description:
    "Manage your HireGeneral employer plan, credits, receipts, and payment methods.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EmployerSubscriptionRoute() {
  const auth = await requireEmployerUser();

  if (!auth.user) {
    redirect("/signin?next=/employers/dashboard/subscription");
  }

  const summary = await getEmployerBillingSummary({
    supabase: auth.supabase,
    recruiterId: auth.user.id,
    email: auth.user.email,
  });

  return <SubscriptionPage initialSummary={summary} />;
}
