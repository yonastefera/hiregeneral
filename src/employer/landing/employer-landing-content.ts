import {
  Building2,
  Briefcase,
  CheckCircle2,
  Globe2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export const featuredCompanies = [
  {
    name: "Sun Life",
    industry: "Insurance",
    roles: 42,
    size: "10k+",
    tag: "Hybrid-first",
    accent: "from-[oklch(0.92_0.08_80)] to-[oklch(0.86_0.12_45)]",
  },
  {
    name: "Choice Hotels",
    industry: "Hospitality",
    roles: 28,
    size: "5k–10k",
    tag: "Remote friendly",
    accent: "from-[oklch(0.92_0.07_20)] to-[oklch(0.86_0.12_350)]",
  },
  {
    name: "Stratos Inc",
    industry: "Fintech",
    roles: 16,
    size: "500–1k",
    tag: "Series C",
    accent: "from-[oklch(0.90_0.08_180)] to-[oklch(0.84_0.13_155)]",
  },
  {
    name: "Northwind Labs",
    industry: "AI Research",
    roles: 9,
    size: "200–500",
    tag: "Hiring fast",
    accent: "from-[oklch(0.91_0.07_220)] to-[oklch(0.86_0.11_200)]",
  },
  {
    name: "Mercer Atlas",
    industry: "Logistics",
    roles: 34,
    size: "1k–5k",
    tag: "Global",
    accent: "from-[oklch(0.91_0.07_300)] to-[oklch(0.84_0.12_275)]",
  },
  {
    name: "Halcyon Health",
    industry: "Healthcare",
    roles: 21,
    size: "5k+",
    tag: "Mission-driven",
    accent: "from-[oklch(0.91_0.08_130)] to-[oklch(0.84_0.12_155)]",
  },
];

export const plans = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/ first post",
    desc: "Try the marketplace with a single open role.",
    features: ["1 active job post", "Public profile page", "Basic analytics"],
    highlight: false,
  },
  {
    name: "Growth",
    price: "$29",
    cadence: "/ month",
    desc: "For teams hiring 5–20 roles a quarter.",
    features: [
      "10 active posts",
      "Featured placement",
      "Candidate CRM",
      "Team seats",
    ],
    highlight: true,
  },
  {
    name: "Scale",
    price: "Custom",
    cadence: "",
    desc: "Enterprise hiring at volume with SLAs.",
    features: [
      "Unlimited posts",
      "ATS integrations",
      "Dedicated partner",
      "SSO + audit logs",
    ],
    highlight: false,
  },
];

export const marketplaceFilters = [
  "All",
  "Engineering",
  "Design",
  "Sales",
  "Operations",
  "Remote",
];

export const hiringMetrics = [
  "2.4M candidates",
  "14-day avg time-to-hire",
  "No sourcing fees",
];

export const livePipelineJobs = [
  {
    company: "SUN LIFE",
    role: "Senior Product Designer",
    location: "Remote · US",
    applicants: 42,
    ago: "2m",
  },
  {
    company: "CHOICE HOTELS",
    role: "Cloud Disaster Recovery Eng.",
    location: "Scottsdale, AZ",
    applicants: 18,
    ago: "12m",
  },
  {
    company: "STRATOS INC",
    role: "Head of Revenue Ops",
    location: "Hybrid · NYC",
    applicants: 9,
    ago: "1h",
  },
];

export const trustedBrands = [
  "Kiser Permanente",
  "Capital One",
  "UMMS",
  "Vercel",
  "Cisco",
  "Stripe",
];

export const whyHireGeneral = [
  {
    icon: Users,
    title: "Vetted candidate pool",
    description: "Every applicant is profile-verified and skill-tagged.",
  },
  {
    icon: TrendingUp,
    title: "Predictive ranking",
    description:
      "Top candidates surface first so teams spend less time sorting.",
  },
  {
    icon: Globe2,
    title: "Global, remote-first",
    description:
      "Hire across regions with cleaner location and salary context.",
  },
  {
    icon: Sparkles,
    title: "AI co-pilot",
    description: "Draft job specs, screening questions, and outreach faster.",
  },
];

export const platformStats = [
  {
    value: "2.4M",
    label: "Active candidates",
  },
  {
    value: "14d",
    label: "Avg. time-to-hire",
  },
  {
    value: "92%",
    label: "Offer acceptance",
  },
  {
    value: "$0",
    label: "Per applicant",
  },
];

export const employerLandingIcons = {
  Building2,
  Briefcase,
  CheckCircle2,
};
