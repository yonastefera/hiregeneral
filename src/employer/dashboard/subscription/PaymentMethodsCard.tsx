import { Check, Plus, X } from "lucide-react";

import { AddPaymentCardForm } from "./AddPaymentCardForm";
import type { PaymentCard, PaymentCardFormState } from "./subscription-content";

type PaymentMethodsCardProps = {
  cards: PaymentCard[];
  addingCard: boolean;
  form: PaymentCardFormState;
  onToggleAddingCard: () => void;
  onFormChange: (form: PaymentCardFormState) => void;
  onSaveCard: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function PaymentMethodsCard({
  cards,
  addingCard,
  form,
  onToggleAddingCard,
  onFormChange,
  onSaveCard,
}: PaymentMethodsCardProps) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold">Payment methods</h3>

        <button
          type="button"
          onClick={onToggleAddingCard}
          className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-200/60"
        >
          {addingCard ? (
            <X className="h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          {addingCard ? "Cancel" : "Add card"}
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {cards.map((card) => (
          <div
            key={`${card.brand}-${card.last}-${card.exp}`}
            className="flex items-center justify-between rounded-xl bg-neutral-50 p-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-12 place-items-center rounded-md bg-gradient-to-br from-neutral-900 to-neutral-700 text-[9px] font-bold text-white">
                {card.brand}
              </div>

              <div>
                <div className="text-[12px] font-medium">•••• {card.last}</div>
                <div className="text-[10px] text-neutral-500">
                  Exp {card.exp}
                </div>
              </div>
            </div>

            {card.primary ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                <Check className="h-2.5 w-2.5" />
                Primary
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {addingCard ? (
        <AddPaymentCardForm
          form={form}
          onFormChange={onFormChange}
          onSubmit={onSaveCard}
        />
      ) : null}
    </section>
  );
}
