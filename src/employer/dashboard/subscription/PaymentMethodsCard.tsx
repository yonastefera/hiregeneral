import { Check, CreditCard, ExternalLink } from "lucide-react";

import type { PaymentMethodSummary } from "./employer-billing-data";

type PaymentMethodsCardProps = {
  methods: PaymentMethodSummary[];
  configured: boolean;
  busy: boolean;
  onManageMethods: () => void;
};

export function PaymentMethodsCard({
  methods,
  configured,
  busy,
  onManageMethods,
}: PaymentMethodsCardProps) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold">Payment methods</h3>

        <button
          type="button"
          onClick={onManageMethods}
          disabled={!configured || busy}
          className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-200/60"
        >
          <ExternalLink className="h-3 w-3" />
          {busy ? "Opening..." : "Manage"}
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {methods.length === 0 ? (
          <div className="rounded-xl bg-neutral-50 p-4 text-[12px] leading-5 text-neutral-500">
            <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-white text-neutral-500 ring-1 ring-black/[0.04]">
              <CreditCard className="h-4 w-4" />
            </div>
            Use Stripe&apos;s secure customer portal to add cards, update
            billing details, cancel plans, and download hosted invoices.
          </div>
        ) : null}

        {methods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between rounded-xl bg-neutral-50 p-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-12 place-items-center rounded-md bg-gradient-to-br from-neutral-900 to-neutral-700 text-[9px] font-bold text-white">
                {method.brand.toUpperCase()}
              </div>

              <div>
                <div className="text-[12px] font-medium">
                  •••• {method.last4}
                </div>
                <div className="text-[10px] text-neutral-500">
                  Exp {String(method.expMonth).padStart(2, "0")}/
                  {String(method.expYear).slice(-2)}
                </div>
              </div>
            </div>

            {method.isPrimary ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                <Check className="h-2.5 w-2.5" />
                Primary
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
