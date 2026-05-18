"use client";

import { useState } from "react";

import { CurrentPlanCard } from "./CurrentPlanCard";
import { PaymentMethodsCard } from "./PaymentMethodsCard";
import { ReceiptsTable } from "./ReceiptsTable";
import {
  detectCardBrand,
  emptyPaymentCardForm,
  initialPaymentCards,
  receipts,
  type PaymentCard,
  type PaymentCardFormState,
} from "./subscription-content";

export function SubscriptionPage() {
  const [cards, setCards] = useState<PaymentCard[]>(initialPaymentCards);
  const [addingCard, setAddingCard] = useState(false);
  const [form, setForm] = useState<PaymentCardFormState>(emptyPaymentCardForm);

  function saveCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const digits = form.number.replace(/\s/g, "");

    if (digits.length < 4 || !form.exp || !form.cvc) {
      return;
    }

    setCards((currentCards) => [
      ...currentCards,
      {
        brand: detectCardBrand(digits),
        last: digits.slice(-4),
        exp: form.exp,
        primary: false,
      },
    ]);

    setForm(emptyPaymentCardForm);
    setAddingCard(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          Subscription & billing
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Manage your plan, credits and payment methods.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <CurrentPlanCard />

        <PaymentMethodsCard
          cards={cards}
          addingCard={addingCard}
          form={form}
          onToggleAddingCard={() => setAddingCard((current) => !current)}
          onFormChange={setForm}
          onSaveCard={saveCard}
        />
      </div>

      <ReceiptsTable receipts={receipts} />
    </div>
  );
}
