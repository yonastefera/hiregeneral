export type PaymentCard = {
  brand: string;
  last: string;
  exp: string;
  primary: boolean;
};

export type PaymentCardFormState = {
  name: string;
  number: string;
  exp: string;
  cvc: string;
};

export type Receipt = {
  id: string;
  date: string;
  description: string;
  amount: string;
};

export const initialPaymentCards: PaymentCard[] = [
  {
    brand: "Visa",
    last: "4242",
    exp: "08/28",
    primary: true,
  },
  {
    brand: "Mastercard",
    last: "1187",
    exp: "11/27",
    primary: false,
  },
];

export const emptyPaymentCardForm: PaymentCardFormState = {
  name: "",
  number: "",
  exp: "",
  cvc: "",
};

export const currentPlanStats = [
  {
    label: "Active jobs",
    value: "5 / 25",
  },
  {
    label: "Account credit",
    value: "$120.00",
  },
  {
    label: "Boost credits",
    value: "3",
  },
  {
    label: "Discounts",
    value: "10% annual",
  },
];

export const receipts: Receipt[] = [
  {
    id: "INV-2104",
    date: "May 1, 2026",
    description: "Growth plan — Monthly",
    amount: "$299.00",
  },
  {
    id: "INV-2087",
    date: "Apr 1, 2026",
    description: "Growth plan — Monthly",
    amount: "$299.00",
  },
  {
    id: "INV-2061",
    date: "Mar 12, 2026",
    description: "10-Day Boost",
    amount: "$45.00",
  },
  {
    id: "INV-2040",
    date: "Mar 1, 2026",
    description: "Growth plan — Monthly",
    amount: "$299.00",
  },
];

export const billingInputClassName =
  "h-9 w-full rounded-lg bg-white px-3 text-[13px] outline-none ring-1 ring-black/[0.04] transition-all focus:ring-2 focus:ring-emerald-400/40";

export function detectCardBrand(cardNumber: string) {
  const digits = cardNumber.replace(/\s/g, "");

  if (digits.startsWith("4")) {
    return "Visa";
  }

  if (/^5[1-5]/.test(digits)) {
    return "Mastercard";
  }

  if (/^3[47]/.test(digits)) {
    return "Amex";
  }

  return "Card";
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
