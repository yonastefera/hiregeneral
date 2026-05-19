export type Receipt = {
  invoiceNumber: string;
  date: string;
  description: string;
  amountCents: number;
  currency: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
};

export const billingInputClassName =
  "h-9 w-full rounded-lg bg-white px-3 text-[13px] outline-none ring-1 ring-black/[0.04] transition-all focus:ring-2 focus:ring-emerald-400/40";

export type PaymentCardFormState = {
  name: string;
  number: string;
  exp: string;
  cvc: string;
};

export const emptyPaymentCardForm: PaymentCardFormState = {
  name: "",
  number: "",
  exp: "",
  cvc: "",
};

export function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatRenewalDate(value: string | null) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not scheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatSubscriptionStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
}
