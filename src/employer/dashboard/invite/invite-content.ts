export type RecommendedCandidate = {
  name: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  match: number;
};

export const inviteJobOptions = [
  "Senior Product Designer",
  "Staff Backend Engineer",
  "Growth Marketing Lead",
  "Customer Success Manager",
] as const;

export const defaultInviteMessage =
  "Hi — your background looks like a strong fit for a role we're hiring at Acme. Would love for you to apply.";

export const recommendedCandidates: RecommendedCandidate[] = [
  {
    name: "Eleanor Park",
    title: "Principal Designer · ex-Airbnb",
    location: "Seattle, WA",
    experience: "12 yrs",
    skills: ["Design Systems", "Figma", "Mobile"],
    match: 97,
  },
  {
    name: "Marcus Holloway",
    title: "Senior Backend Engineer · ex-Stripe",
    location: "Remote · US",
    experience: "9 yrs",
    skills: ["Go", "Postgres", "Kafka"],
    match: 94,
  },
  {
    name: "Sofia Reyes",
    title: "Growth Marketer · ex-Notion",
    location: "Brooklyn, NY",
    experience: "7 yrs",
    skills: ["SEO", "Lifecycle", "Paid"],
    match: 91,
  },
  {
    name: "Kai Tanaka",
    title: "Product Designer · ex-Linear",
    location: "Tokyo, JP",
    experience: "6 yrs",
    skills: ["Motion", "Brand", "UI"],
    match: 89,
  },
  {
    name: "Aria Bennett",
    title: "Customer Success Lead · ex-Intercom",
    location: "Dublin, IE",
    experience: "8 yrs",
    skills: ["B2B SaaS", "Onboarding"],
    match: 86,
  },
  {
    name: "Noah Williams",
    title: "Staff Frontend Engineer · ex-Vercel",
    location: "Remote · EU",
    experience: "10 yrs",
    skills: ["React", "TS", "Edge"],
    match: 84,
  },
];
