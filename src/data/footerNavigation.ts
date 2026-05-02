import { BriefcaseBusiness, Building2, Globe2 } from "lucide-react";

export const footerSections = [
  {
    title: "Technology Professionals",
    icon: BriefcaseBusiness,
    links: [
      { label: "Browse tech jobs", to: "/jobs" },
      { label: "Saved jobs", to: "/saved-jobs" },
      { label: "Salary gu3ide", to: "/salary-guide" },
      { label: "Career advice", to: "/career-advice" },
      { label: "Profile visibility", to: "/profile-visibility" },
    ],
  },
  {
    title: "Employers & Recruiters",
    icon: Building2,
    links: [
      { label: "Post a job", to: "/employers/post-job" },
      { label: "Search candidates", to: "/employers/candidates" },
      { label: "Recruiter dashboard", to: "/employers/dashboard" },
      { label: "Hiring resources", to: "/employers/resources" },
      { label: "Employer branding", to: "/employers/branding" },
    ],
  },
  {
    title: "Company Information",
    icon: Globe2,
    links: [
      { label: "About HireGeneral", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "Accessibility", to: "/accessibility" },
    ],
  },
];

export const legalLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Use", to: "/terms" },
  { label: "Cookie Policy", to: "/cookies" },
  { label: "Do Not Sell My Info", to: "/privacy-choices" },
];