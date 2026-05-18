export type CompanyProfile = {
  name: string;
  initials: string;
  createdAt: string;
  activeJobs: number;
  websiteLabel: string;
  websiteUrl: string;
  industry: string;
  size: string;
  about: string;
};

export const companyProfile: CompanyProfile = {
  name: "Acme Inc.",
  initials: "AC",
  createdAt: "Jan 14, 2026",
  activeJobs: 5,
  websiteLabel: "acme.com",
  websiteUrl: "https://acme.com",
  industry: "Software",
  size: "1-10",
  about:
    "Acme is building the future of work. We hire kind, ambitious people who care about the craft.",
};

export const industryOptions = [
  "Software",
  "Finance",
  "Healthcare",
  "Retail",
] as const;

export const companySizeOptions = ["1-10", "11-50", "51-200", "200+"] as const;
