import {
  Building2,
  Code2,
  Database,
  LineChart,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

export type UserFlow = "job_seeker" | "recruiter" | "admin";

export type JobListing = {
  id: string;
  slug: string;
  title: string;
  company: string;
  logo: string;
  companyTagline: string;
  companySize: string;
  companyWebsite: string;
  location: string;
  distance: number;
  salary?: string;
  postedDaysAgo: number;
  employmentType: string;
  workMode: string;
  experienceLevel: string;
  skills: string[];
  summary: string;
  category: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  applyUrl?: string;
  applicants: number;
};

export const flowCards = [
  {
    role: "job_seeker" as const,
    title: "Job seeker",
    description:
      "Search roles, save favorites, manage resume, skills, privacy, and applications.",
    icon: Code2,
  },
  {
    role: "recruiter" as const,
    title: "Recruiter",
    description:
      "Post jobs, manage company presence, review applicants, and update listings.",
    icon: Building2,
  },
  {
    role: "admin" as const,
    title: "Admin",
    description:
      "Monitor marketplace quality, roles, companies, reports, and publishing activity.",
    icon: ShieldCheck,
  },
];

export const platformStats = [
  { label: "Open roles", value: "18.4k", icon: Database },
  { label: "Hiring teams", value: "3.2k", icon: Building2 },
  { label: "Weekly matches", value: "91k", icon: LineChart },
  { label: "New today", value: "620", icon: Megaphone },
];
