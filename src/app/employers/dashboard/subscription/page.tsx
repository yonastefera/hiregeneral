import type { Metadata } from "next";

import { SubscriptionPage } from "@/employer/dashboard/subscription/SubscriptionPage";

export const metadata: Metadata = {
  title: "Subscription & Billing — HireGeneral",
  description:
    "Manage your HireGeneral employer plan, credits, receipts, and payment methods.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerSubscriptionRoute() {
  return <SubscriptionPage />;
}
