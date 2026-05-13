import type { Metadata } from "next";
import type { JobSeekerDashboardStats } from "./job-seeker-dashboard-data";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const jobSeekerDashboardMetadata: Metadata = {
  title: "Job Seeker Dashboard | Job Board Platform",
  description:
    "Track your job search activity, browse featured jobs, and manage your job search from one dashboard.",
  alternates: {
    canonical: "/dashboard",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Job Seeker Dashboard | Job Board Platform",
    description:
      "Track your job search activity, browse featured jobs, and manage your job search from one dashboard.",
    type: "website",
    url: "/dashboard",
    siteName: "Job Board Platform",
  },
  twitter: {
    card: "summary",
    title: "Job Seeker Dashboard | Job Board Platform",
    description:
      "Track your job search activity, browse featured jobs, and manage your job search from one dashboard.",
  },
};

function getJobSeekerDashboardBreadcrumbSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Job Seeker Dashboard",
        item: `${SITE_URL}/dashboard`,
      },
    ],
  };
}

export function getJobSeekerDashboardPageSchema(
  stats: JobSeekerDashboardStats,
) {
  return [
    getJobSeekerDashboardBreadcrumbSchema(),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Job Seeker Dashboard",
      description:
        "Track job search activity, browse featured jobs, and manage job search progress.",
      url: `${SITE_URL}/dashboard`,
      about: [
        {
          "@type": "Thing",
          name: "Available job listings",
          value: stats.totalJobs,
        },
        {
          "@type": "Thing",
          name: "Applications",
          value: stats.totalApplications,
        },
        {
          "@type": "Thing",
          name: "Registered users",
          value: stats.totalUsers,
        },
        {
          "@type": "Thing",
          name: "Companies",
          value: stats.totalCompanies,
        },
      ],
    },
  ];
}
