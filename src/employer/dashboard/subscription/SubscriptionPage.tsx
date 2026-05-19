"use client";

import { useState } from "react";

import type { EmployerBillingSummary } from "./employer-billing-data";
import { CurrentPlanCard } from "./CurrentPlanCard";
import { PaymentMethodsCard } from "./PaymentMethodsCard";
import { ReceiptsTable } from "./ReceiptsTable";

type SubscriptionPageProps = {
  initialSummary: EmployerBillingSummary;
};

async function readBillingRedirect(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Could not open Stripe billing.");
  }

  return payload.url;
}

export function SubscriptionPage({ initialSummary }: SubscriptionPageProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [busyAction, setBusyAction] = useState<
    "growth" | "pro" | "portal" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: "growth" | "pro") {
    setBusyAction(plan);
    setError(null);

    try {
      const url = await readBillingRedirect(
        await fetch("/api/employers/billing/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        }),
      );

      window.location.assign(url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function openPortal() {
    setBusyAction("portal");
    setError(null);

    try {
      const url = await readBillingRedirect(
        await fetch("/api/employers/billing/create-portal-session", {
          method: "POST",
        }),
      );

      window.location.assign(url);
    } catch (portalError) {
      setError(
        portalError instanceof Error
          ? portalError.message
          : "Could not open the billing portal.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function refreshSummary() {
    setError(null);

    try {
      const response = await fetch("/api/employers/billing/summary", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as {
        summary?: EmployerBillingSummary;
        error?: string;
      } | null;

      if (!response.ok || !payload?.summary) {
        throw new Error(payload?.error || "Could not refresh billing.");
      }

      setSummary(payload.summary);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh billing.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">
            Subscription & billing
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Manage your plan, credits, receipts and payment methods.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshSummary}
          className="rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-neutral-700 shadow-sm ring-1 ring-black/[0.04] transition hover:bg-neutral-50"
        >
          Refresh
        </button>
      </div>

      {summary.stripeWarning || error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error || summary.stripeWarning}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <CurrentPlanCard
          summary={summary}
          busyAction={busyAction}
          onUpgrade={startCheckout}
          onManagePlan={openPortal}
        />

        <PaymentMethodsCard
          methods={summary.paymentMethods}
          configured={summary.configured}
          busy={busyAction === "portal"}
          onManageMethods={openPortal}
        />
      </div>

      <ReceiptsTable receipts={summary.receipts} />
    </div>
  );
}
