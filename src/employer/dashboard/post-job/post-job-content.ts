export type PostJobMode = "new" | "duplicate";

export type RemoteOption = "yes" | "no";

export type ScreeningQuestion = {
  id: string;
  question: string;
  required: boolean;
};

export type EditableJob = {
  id: string;
  slug: string | null;
  status: "draft" | "published" | "closed";
  title: string;
  companyName: string;
  location: string;
  streetAddress: string;
  remote: RemoteOption;
  distance: number;
  includeRelocation: boolean;
  employmentType: string;
  description: string;
  skills: string;
  benefits: string[];
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  payFrequency: string;
  boostId: string;
  notificationEmail: string;
  screeningQuestions: ScreeningQuestion[];
};

export type BoostOption = {
  id: string;
  label: string;
  price: string;
  description: string;
};

export const boostOptions: BoostOption[] = [
  {
    id: "none",
    label: "No Boost",
    price: "Free",
    description: "Standard placement",
  },
  {
    id: "3",
    label: "3-Day Boost",
    price: "$24",
    description: "Top of search · 3 days",
  },
  {
    id: "5",
    label: "5-Day Boost",
    price: "$35",
    description: "Top of search · 5 days",
  },
  {
    id: "10",
    label: "10-Day Boost",
    price: "$45",
    description: "Top + featured · 10 days",
  },
  {
    id: "20",
    label: "20-Day Boost",
    price: "$79",
    description: "Top + featured · 20 days",
  },
];

export const benefitOptions = [
  "Medical",
  "Dental",
  "Vision",
  "Retirement (401k)",
  "Life insurance",
  "Paid time off",
  "None",
] as const;

export const employmentTypeOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Other",
] as const;

export const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

export const payFrequencyOptions = [
  "Per year",
  "Per month",
  "Per hour",
] as const;

export const inputClassName =
  "h-10 w-full rounded-lg bg-neutral-50 px-3 text-[13px] text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/40";
