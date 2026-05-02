import { Building2, Code2, Database, LineChart, Megaphone, ShieldCheck } from "lucide-react";

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

export const citySuggestions = [
  "New York, NY",
  "San Francisco, CA",
  "Austin, TX",
  "Seattle, WA",
  "Chicago, IL",
  "Boston, MA",
  "Denver, CO",
  "Remote - United States",
];

export const featuredJobs: JobListing[] = [
  {
    id: "job-1",
    slug: "senior-frontend-engineer-northstar-labs",
    title: "Senior Frontend Engineer",
    company: "Northstar Labs",
    logo: "NL",
    companyTagline: "Hiring intelligence platform used by 1,200+ recruiting teams.",
    companySize: "120–180 employees",
    companyWebsite: "https://careers.northstarlabs.example.com",
    location: "New York, NY",
    distance: 8,
    salary: "$145k – $185k",
    postedDaysAgo: 1,
    employmentType: "Full-time",
    workMode: "Hybrid",
    experienceLevel: "Senior · 5+ years",
    skills: ["React", "TypeScript", "Design Systems", "Next.js", "Testing"],
    summary: "Own the candidate-facing experience for a fast-growing hiring intelligence product.",
    category: "Engineering",
    description:
      "Northstar Labs is hiring a Senior Frontend Engineer to lead the candidate-facing experience across our hiring intelligence platform. You will partner closely with design, product, and platform engineering to ship a fast, accessible interface trusted by hundreds of thousands of weekly applicants.",
    responsibilities: [
      "Design and ship complex, accessible UI flows in React and TypeScript",
      "Own performance, observability, and test coverage for the candidate web app",
      "Collaborate with designers on a shared component library and design tokens",
      "Mentor mid-level engineers through code review, pairing, and architecture docs",
    ],
    requirements: [
      "5+ years building production React applications at scale",
      "Strong TypeScript fundamentals and component architecture experience",
      "Proven track record with accessibility (WCAG 2.1 AA) and performance budgets",
      "Comfort working closely with product, design, and backend partners",
    ],
    benefits: [
      "Equity in a profitable Series B company",
      "Hybrid schedule from our SoHo office (3 days in person)",
      "$2,000 annual learning and conference stipend",
      "Comprehensive medical, dental, vision, and 401(k) match",
    ],
    applyUrl: "https://careers.northstarlabs.example.com/senior-frontend-engineer",
    applicants: 84,
  },
  {
    id: "job-2",
    slug: "product-designer-marketplace-luma-works",
    title: "Product Designer, Marketplace",
    company: "Luma Works",
    logo: "LW",
    companyTagline: "Remote-first design studio building modern marketplace tools.",
    companySize: "60–90 employees",
    companyWebsite: "https://lumaworks.example.com/careers",
    location: "Remote - United States",
    distance: 0,
    salary: "$118k – $152k",
    postedDaysAgo: 3,
    employmentType: "Full-time",
    workMode: "Remote",
    experienceLevel: "Mid–Senior · 4+ years",
    skills: ["Figma", "UX Research", "Prototyping", "Design Systems"],
    summary: "Shape a modern job matching flow for candidates and high-volume recruiting teams.",
    category: "Design",
    description:
      "Luma Works is looking for a Product Designer to lead end-to-end design for our marketplace surfaces. You will own discovery, candidate matching, and recruiter workflows, partnering with research and engineering on every release.",
    responsibilities: [
      "Lead design for two marketplace surfaces from research to launch",
      "Run lightweight user interviews and usability sessions with candidates and recruiters",
      "Contribute components and patterns to the shared design system",
      "Pair daily with frontend engineers to ensure pixel-accurate delivery",
    ],
    requirements: [
      "4+ years designing complex SaaS or marketplace products",
      "A portfolio that shows clear problem framing, iteration, and outcomes",
      "Comfort with both qualitative research and quantitative product data",
      "Async-first communication and strong written craft",
    ],
    benefits: [
      "Fully remote within the United States",
      "$3,500 annual home-office and equipment budget",
      "Quarterly team offsites in Lisbon, Mexico City, and Denver",
      "Unlimited PTO with a 4-week minimum",
    ],
    applyUrl: "https://lumaworks.example.com/careers/product-designer-marketplace",
    applicants: 156,
  },
  {
    id: "job-3",
    slug: "data-platform-analyst-meridian-health",
    title: "Data Platform Analyst",
    company: "Meridian Health",
    logo: "MH",
    companyTagline: "Regional health system serving 2.3 million patients.",
    companySize: "5,000+ employees",
    companyWebsite: "https://careers.meridianhealth.example.com",
    location: "Chicago, IL",
    distance: 22,
    salary: "$92k – $118k",
    postedDaysAgo: 7,
    employmentType: "Contract",
    workMode: "On-site",
    experienceLevel: "Mid · 3+ years",
    skills: ["SQL", "Tableau", "Python", "dbt"],
    summary: "Build trusted reporting pipelines for clinical operations and finance teams.",
    category: "Data",
    description:
      "Meridian Health is hiring a Data Platform Analyst on a 12-month contract to support our clinical operations and finance reporting modernization. You will partner with engineering and analytics leaders to ship trusted, well-documented reporting models.",
    responsibilities: [
      "Build and maintain SQL and dbt models in our warehouse",
      "Partner with stakeholders to translate operational questions into metrics",
      "Develop Tableau dashboards used by directors and executives",
      "Document lineage, ownership, and known limitations for every model",
    ],
    requirements: [
      "3+ years of analytics or analytics-engineering experience",
      "Strong SQL, comfort with Python for data transformation",
      "Experience with Tableau or similar BI platforms",
      "Healthcare data exposure is a plus, not a requirement",
    ],
    benefits: [
      "Competitive contract day rate",
      "On-site collaboration in our downtown Chicago office",
      "Access to learning subscriptions and internal data community",
      "Possible conversion to full-time after the contract",
    ],
    applyUrl: "https://careers.meridianhealth.example.com/data-platform-analyst",
    applicants: 41,
  },
  {
    id: "job-4",
    slug: "growth-marketing-manager-evergreen-solar",
    title: "Growth Marketing Manager",
    company: "Evergreen Solar",
    logo: "ES",
    companyTagline: "Residential solar installer operating across 14 US states.",
    companySize: "300–500 employees",
    companyWebsite: "https://evergreensolar.example.com/careers",
    location: "Austin, TX",
    distance: 14,
    salary: "$105k – $132k",
    postedDaysAgo: 11,
    employmentType: "Full-time",
    workMode: "Hybrid",
    experienceLevel: "Mid–Senior · 4+ years",
    skills: ["Lifecycle", "SEO", "Analytics", "Paid media"],
    summary: "Lead acquisition experiments across paid, lifecycle, content, and partner channels.",
    category: "Marketing",
    description:
      "Evergreen Solar is hiring a Growth Marketing Manager to own paid, lifecycle, and partner acquisition for our residential solar product across 14 states. You will work with data, sales, and creative teams to ship measurable experiments every week.",
    responsibilities: [
      "Plan and execute paid acquisition across search, social, and CTV",
      "Own lifecycle marketing across email and SMS",
      "Run a weekly experimentation cadence with clear hypotheses and outcomes",
      "Partner with finance on payback, CAC, and channel mix reporting",
    ],
    requirements: [
      "4+ years of growth or performance marketing experience",
      "Strong analytical instincts and comfort with SQL or BI tools",
      "Experience managing a paid budget of $1M+ annualized",
      "Excellent written communication and cross-functional partnership",
    ],
    benefits: [
      "Hybrid schedule from our East Austin office (2 days in person)",
      "Equity participation and annual bonus target",
      "Generous parental leave and caregiver support",
      "Sustainable commute and home solar employee credits",
    ],
    applyUrl: "https://evergreensolar.example.com/careers/growth-marketing-manager",
    applicants: 67,
  },
  {
    id: "job-5",
    slug: "cloud-security-engineer-arcvault",
    title: "Cloud Security Engineer",
    company: "ArcVault",
    logo: "AV",
    companyTagline: "Compliance automation platform for cloud-native engineering teams.",
    companySize: "80–120 employees",
    companyWebsite: "https://arcvault.example.com/careers",
    location: "Seattle, WA",
    distance: 35,
    salary: "$158k – $205k",
    postedDaysAgo: 2,
    employmentType: "Full-time",
    workMode: "Remote",
    experienceLevel: "Senior · 6+ years",
    skills: ["AWS", "SOC 2", "Kubernetes", "Terraform", "IAM"],
    summary: "Harden infrastructure, automate compliance, and partner with product engineering.",
    category: "Security",
    description:
      "ArcVault is hiring a Cloud Security Engineer to harden our AWS and Kubernetes footprint, automate compliance evidence collection, and partner with product engineering on secure-by-default platform patterns.",
    responsibilities: [
      "Own security architecture across AWS, Kubernetes, and developer tooling",
      "Automate SOC 2 and ISO 27001 evidence collection",
      "Partner with engineering on secure CI/CD, IAM, and secrets management",
      "Lead incident response readiness and tabletop exercises",
    ],
    requirements: [
      "6+ years in cloud security, infrastructure, or platform engineering",
      "Deep AWS, Kubernetes, and Terraform expertise",
      "Familiarity with SOC 2, ISO 27001, or HIPAA programs",
      "Pragmatic, collaborative approach to working with engineers",
    ],
    benefits: [
      "Fully remote within the United States",
      "Annual security conference budget (RSA, Black Hat, fwd:cloudsec)",
      "Equity refresh program and 401(k) match",
      "Mental health, medical, dental, and vision coverage",
    ],
    applyUrl: "https://arcvault.example.com/careers/cloud-security-engineer",
    applicants: 29,
  },
  {
    id: "job-6",
    slug: "staff-product-manager-platform-helix-labs",
    title: "Staff Product Manager, Platform",
    company: "Helix Labs",
    logo: "HL",
    companyTagline: "AI infrastructure for modern product teams.",
    companySize: "200–300 employees",
    companyWebsite: "https://helixlabs.example.com/careers",
    location: "San Francisco, CA",
    distance: 6,
    salary: "$210k – $260k",
    postedDaysAgo: 4,
    employmentType: "Full-time",
    workMode: "Hybrid",
    experienceLevel: "Staff · 8+ years",
    skills: ["Platform PM", "APIs", "Roadmapping", "Developer experience"],
    summary: "Define the platform roadmap for AI APIs trusted by thousands of developers.",
    category: "Product",
    description:
      "Helix Labs is hiring a Staff Product Manager to own our platform roadmap. You will partner with engineering, design, and developer relations to ship APIs and SDKs that developers love.",
    responsibilities: [
      "Define and communicate the platform roadmap and quarterly bets",
      "Partner with engineering on API design, versioning, and reliability",
      "Run customer discovery with developers and platform leaders",
      "Drive cross-functional planning and launch readiness",
    ],
    requirements: [
      "8+ years of product management, including platform or API products",
      "Strong technical background — comfort reading API specs and code",
      "Track record of shipping products developers actually adopt",
      "Excellent written communication and stakeholder management",
    ],
    benefits: [
      "Hybrid schedule from our SoMa office (3 days in person)",
      "Significant equity in a Series C company",
      "Comprehensive health, dental, and vision coverage",
      "Catered lunches and commuter benefits",
    ],
    applyUrl: "https://helixlabs.example.com/careers/staff-product-manager-platform",
    applicants: 213,
  },
];

export function getJobBySlug(slug: string) {
  return featuredJobs.find((job) => job.slug === slug);
}

export const flowCards = [
  {
    role: "job_seeker" as const,
    title: "Job seeker",
    description: "Search roles, save favorites, manage resume, skills, privacy, and applications.",
    icon: Code2,
  },
  {
    role: "recruiter" as const,
    title: "Recruiter",
    description: "Post jobs, manage company presence, review applicants, and update listings.",
    icon: Building2,
  },
  {
    role: "admin" as const,
    title: "Admin",
    description: "Monitor marketplace quality, roles, companies, reports, and publishing activity.",
    icon: ShieldCheck,
  },
];

export const platformStats = [
  { label: "Open roles", value: "18.4k", icon: Database },
  { label: "Hiring teams", value: "3.2k", icon: Building2 },
  { label: "Weekly matches", value: "91k", icon: LineChart },
  { label: "New today", value: "620", icon: Megaphone },
];
