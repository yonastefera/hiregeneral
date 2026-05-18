import { BillingField } from "./BillingField";
import {
  billingInputClassName,
  formatCardNumber,
  formatExpiry,
  type PaymentCardFormState,
} from "./subscription-content";

type AddPaymentCardFormProps = {
  form: PaymentCardFormState;
  onFormChange: (form: PaymentCardFormState) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function AddPaymentCardForm({
  form,
  onFormChange,
  onSubmit,
}: AddPaymentCardFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 space-y-2 rounded-xl bg-neutral-50 p-3"
    >
      <BillingField label="Cardholder name">
        <input
          value={form.name}
          onChange={(event) =>
            onFormChange({ ...form, name: event.target.value })
          }
          placeholder="Nick Anderson"
          className={billingInputClassName}
          required
        />
      </BillingField>

      <BillingField label="Card number">
        <input
          value={form.number}
          onChange={(event) =>
            onFormChange({
              ...form,
              number: formatCardNumber(event.target.value),
            })
          }
          placeholder="1234 5678 9012 3456"
          className={billingInputClassName}
          inputMode="numeric"
          required
        />
      </BillingField>

      <div className="grid grid-cols-2 gap-2">
        <BillingField label="Expiry">
          <input
            value={form.exp}
            onChange={(event) =>
              onFormChange({
                ...form,
                exp: formatExpiry(event.target.value),
              })
            }
            placeholder="MM/YY"
            className={billingInputClassName}
            required
          />
        </BillingField>

        <BillingField label="CVC">
          <input
            value={form.cvc}
            onChange={(event) =>
              onFormChange({
                ...form,
                cvc: event.target.value.replace(/\D/g, "").slice(0, 4),
              })
            }
            placeholder="123"
            className={billingInputClassName}
            required
          />
        </BillingField>
      </div>

      <button
        type="submit"
        className="mt-1 w-full rounded-lg bg-linear-to-b from-teal-500 to-emerald-600 py-2 text-[12px] font-semibold text-white"
      >
        Save card
      </button>
    </form>
  );
}
