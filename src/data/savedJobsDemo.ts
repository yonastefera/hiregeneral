export type SavedJobRecord = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary?: string;
  savedAt: string; // ISO
  active: boolean; // false = inactive >60 days, hidden by filter
  slug: string;
};

export type ApplicationRecord = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  resumeName: string;
  resumeUrl: string;
  appliedAt: string; // ISO
  receivedAt: string; // ISO
  status: "submitted" | "reviewed" | "interview" | "closed";
  slug: string;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const demoSavedJobs: SavedJobRecord[] = [
  {
    id: "s1",
    jobId: "job-1",
    slug: "senior-frontend-engineer-northstar-labs",
    title: "Senior Frontend Engineer",
    company: "Northstar Labs",
    logo: "NL",
    location: "New York, NY",
    salary: "$145k – $185k",
    savedAt: daysAgo(2),
    active: true,
  },
  {
    id: "s2",
    jobId: "job-2",
    slug: "product-designer-marketplace-luma-works",
    title: "Product Designer, Marketplace",
    company: "Luma Works",
    logo: "LW",
    location: "Remote - United States",
    salary: "$118k – $152k",
    savedAt: daysAgo(5),
    active: true,
  },
  {
    id: "s3",
    jobId: "job-5",
    slug: "cloud-security-engineer-arcvault",
    title: "Cloud Security Engineer",
    company: "ArcVault",
    logo: "AV",
    location: "Seattle, WA",
    salary: "$158k – $205k",
    savedAt: daysAgo(9),
    active: true,
  },
  {
    id: "s4",
    jobId: "job-4",
    slug: "growth-marketing-manager-evergreen-solar",
    title: "Growth Marketing Manager",
    company: "Evergreen Solar",
    logo: "ES",
    location: "Austin, TX",
    salary: "$105k – $132k",
    savedAt: daysAgo(14),
    active: true,
  },
  {
    id: "s5",
    jobId: "job-6",
    slug: "staff-product-manager-platform-helix-labs",
    title: "Staff Product Manager, Platform",
    company: "Helix Labs",
    logo: "HL",
    location: "San Francisco, CA",
    salary: "$210k – $260k",
    savedAt: daysAgo(20),
    active: true,
  },
  {
    id: "s6",
    jobId: "job-3",
    slug: "data-platform-analyst-meridian-health",
    title: "Data Platform Analyst",
    company: "Meridian Health",
    logo: "MH",
    location: "Chicago, IL",
    salary: "$92k – $118k",
    savedAt: daysAgo(28),
    active: true,
  },
  {
    id: "s7",
    jobId: "job-0",
    slug: "full-stack-engineer-hiregeneral",
    title: "Full-Stack Engineer",
    company: "Brightline Studio",
    logo: "BS",
    location: "Remote - United States",
    salary: "$135k – $170k",
    savedAt: daysAgo(33),
    active: true,
  },
  {
    id: "s8",
    jobId: "job-x1",
    slug: "platform-engineer-quill-systems",
    title: "Platform Engineer",
    company: "Quill Systems",
    logo: "QS",
    location: "Boston, MA",
    salary: "$150k – $190k",
    savedAt: daysAgo(40),
    active: true,
  },
  {
    id: "s9",
    jobId: "job-x2",
    slug: "lead-ux-researcher-northbeam",
    title: "Lead UX Researcher",
    company: "Northbeam",
    logo: "NB",
    location: "Remote - United States",
    salary: "$130k – $165k",
    savedAt: daysAgo(48),
    active: true,
  },
  {
    id: "s10",
    jobId: "job-x3",
    slug: "site-reliability-engineer-orbital",
    title: "Site Reliability Engineer",
    company: "Orbital",
    logo: "OR",
    location: "Denver, CO",
    salary: "$160k – $200k",
    savedAt: daysAgo(55),
    active: true,
  },
  // Inactive (>60 days) — should be hidden
  {
    id: "s11",
    jobId: "job-x4",
    slug: "android-engineer-loop",
    title: "Android Engineer",
    company: "Loop",
    logo: "LP",
    location: "Seattle, WA",
    salary: "$140k – $175k",
    savedAt: daysAgo(75),
    active: false,
  },
  {
    id: "s12",
    jobId: "job-x5",
    slug: "data-scientist-veritext",
    title: "Data Scientist",
    company: "Veritext",
    logo: "VT",
    location: "Remote - United States",
    salary: "$155k – $195k",
    savedAt: daysAgo(92),
    active: false,
  },
];

export const demoApplications: ApplicationRecord[] = [
  {
    id: "a1",
    jobId: "job-0",
    slug: "full-stack-engineer-hiregeneral",
    title: "Full-Stack Engineer",
    company: "Brightline Studio",
    logo: "BS",
    location: "Remote - United States",
    resumeName: "AveryMorgan_Resume_2026.pdf",
    resumeUrl: "#",
    appliedAt: daysAgo(1),
    receivedAt: daysAgo(1),
    status: "submitted",
  },
  {
    id: "a2",
    jobId: "job-1",
    slug: "senior-frontend-engineer-northstar-labs",
    title: "Senior Frontend Engineer",
    company: "Northstar Labs",
    logo: "NL",
    location: "New York, NY",
    resumeName: "AveryMorgan_Resume_2026.pdf",
    resumeUrl: "#",
    appliedAt: daysAgo(4),
    receivedAt: daysAgo(4),
    status: "reviewed",
  },
  {
    id: "a3",
    jobId: "job-5",
    slug: "cloud-security-engineer-arcvault",
    title: "Cloud Security Engineer",
    company: "ArcVault",
    logo: "AV",
    location: "Seattle, WA",
    resumeName: "AveryMorgan_Resume_2026.pdf",
    resumeUrl: "#",
    appliedAt: daysAgo(9),
    receivedAt: daysAgo(9),
    status: "interview",
  },
  {
    id: "a4",
    jobId: "job-4",
    slug: "growth-marketing-manager-evergreen-solar",
    title: "Growth Marketing Manager",
    company: "Evergreen Solar",
    logo: "ES",
    location: "Austin, TX",
    resumeName: "AveryMorgan_Resume_2026.pdf",
    resumeUrl: "#",
    appliedAt: daysAgo(13),
    receivedAt: daysAgo(13),
    status: "submitted",
  },
  {
    id: "a5",
    jobId: "job-2",
    slug: "product-designer-marketplace-luma-works",
    title: "Product Designer, Marketplace",
    company: "Luma Works",
    logo: "LW",
    location: "Remote - United States",
    resumeName: "AveryMorgan_Portfolio.pdf",
    resumeUrl: "#",
    appliedAt: daysAgo(18),
    receivedAt: daysAgo(18),
    status: "closed",
  },
  {
    id: "a6",
    jobId: "job-6",
    slug: "staff-product-manager-platform-helix-labs",
    title: "Staff Product Manager, Platform",
    company: "Helix Labs",
    logo: "HL",
    location: "San Francisco, CA",
    resumeName: "AveryMorgan_Resume_2026.pdf",
    resumeUrl: "#",
    appliedAt: daysAgo(22),
    receivedAt: daysAgo(22),
    status: "reviewed",
  },
  {
    id: "a7",
    jobId: "job-3",
    slug: "data-platform-analyst-meridian-health",
    title: "Data Platform Analyst",
    company: "Meridian Health",
    logo: "MH",
    location: "Chicago, IL",
    resumeName: "AveryMorgan_Resume_2026.pdf",
    resumeUrl: "#",
    appliedAt: daysAgo(30),
    receivedAt: daysAgo(30),
    status: "closed",
  },
  {
    id: "a8",
    jobId: "job-x1",
    slug: "platform-engineer-quill-systems",
    title: "Platform Engineer",
    company: "Quill Systems",
    logo: "QS",
    location: "Boston, MA",
    resumeName: "AveryMorgan_Resume_2026.pdf",
    resumeUrl: "#",
    appliedAt: daysAgo(38),
    receivedAt: daysAgo(38),
    status: "submitted",
  },
  {
    id: "a9",
    jobId: "job-x2",
    slug: "lead-ux-researcher-northbeam",
    title: "Lead UX Researcher",
    company: "Northbeam",
    logo: "NB",
    location: "Remote - United States",
    resumeName: "AveryMorgan_Resume_2026.pdf",
    resumeUrl: "#",
    appliedAt: daysAgo(45),
    receivedAt: daysAgo(45),
    status: "reviewed",
  },
];

export function formatPrettyDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
