import { BriefcaseBusiness, Building2, Globe2 } from "lucide-react";

export type FooterLinkAudience =
  | "public"
  | "authenticated"
  | "job_seeker"
  | "recruiter"
  | "admin";

export type FooterLink = {
  label: string;
  to: string;
  audience?: FooterLinkAudience;
};

export type FooterSection = {
  title: string;
  icon: typeof BriefcaseBusiness;
  links: FooterLink[];
};

export const footerSections: FooterSection[] = [
  {
    title: "Technology Professionals",
    icon: BriefcaseBusiness,
    links: [
      { label: "Browse tech jobs", to: "/jobs", audience: "public" },
      { label: "Saved jobs", to: "/saved", audience: "job_seeker" },
      { label: "Salaries", to: "/salaries", audience: "public" },
      { label: "Profile", to: "/profile", audience: "job_seeker" },
      {
        label: "Profile visibility",
        to: "/profile-visibility",
        audience: "job_seeker",
      },
    ],
  },
  {
    title: "Employers & Recruiters",
    icon: Building2,
    links: [
      {
        label: "Post a job",
        to: "/employers/dashboard/post-job",
        audience: "recruiter",
      },
      {
        label: "Search candidates",
        to: "/employers/candidates",
        audience: "recruiter",
      },
      {
        label: "Recruiter dashboard",
        to: "/employers/dashboard",
        audience: "recruiter",
      },
      {
        label: "Hiring resources",
        to: "/employers/resources",
        audience: "public",
      },
      {
        label: "Employer branding",
        to: "/employers/branding",
        audience: "public",
      },
    ],
  },
  {
    title: "Company Information",
    icon: Globe2,
    links: [
      { label: "About HireGeneral", to: "/about", audience: "public" },
      { label: "Contact", to: "/contact", audience: "public" },
      { label: "Privacy", to: "/privacy", audience: "public" },
      { label: "Terms", to: "/terms", audience: "public" },
      { label: "Accessibility", to: "/accessibility", audience: "public" },
    ],
  },
];

export const legalLinks: FooterLink[] = [
  { label: "Privacy Policy", to: "/privacy", audience: "public" },
  { label: "Terms of Use", to: "/terms", audience: "public" },
  { label: "Cookie Policy", to: "/cookies", audience: "public" },
  {
    label: "Do Not Sell My Info",
    to: "/privacy-choices",
    audience: "public",
  },
];
