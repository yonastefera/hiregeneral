export type CompanyProfile = {
  id: string | null;
  name: string;
  initials: string;
  location: string;
  createdAt: string;
  activeJobs: number;
  websiteLabel: string;
  websiteUrl: string;
  industry: string;
  size: string;
  tagline: string;
  about: string;
  logoUrl: string | null;
};

export const companyProfile: CompanyProfile = {
  id: null,
  name: "Acme Inc.",
  initials: "AC",
  location: "Remote",
  createdAt: "Jan 14, 2026",
  activeJobs: 5,
  websiteLabel: "acme.com",
  websiteUrl: "https://acme.com",
  industry: "Software",
  size: "1-10",
  tagline: "Hiring thoughtful builders for modern teams.",
  about:
    "Acme is building the future of work. We hire kind, ambitious people who care about the craft.",
  logoUrl: null,
};

export const industryOptions = [
  "Software",
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Hospitality",
  "Education",
  "Consulting",
  "Manufacturing",
  "Other",
] as const;

export const companySizeOptions = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1,000",
  "1,001-5,000",
  "5,001+",
] as const;
