import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const indexPageMetadata: Metadata = {
  title: "HireGeneral | Search Jobs and Hire Faster",
  description:
    "Search jobs, save listings, build candidate profiles, and help recruiters hire faster with HireGeneral.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "HireGeneral | Search Jobs and Hire Faster",
    description: "A modern hiring marketplace for candidates and recruiters.",
    type: "website",
    url: "/",
    siteName: "HireGeneral",
  },
  twitter: {
    card: "summary_large_image",
    title: "HireGeneral | Search Jobs and Hire Faster",
    description:
      "Search jobs, save listings, build candidate profiles, and help recruiters hire faster.",
  },
};

export function getIndexPageSchema() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "HireGeneral",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/jobs?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "HireGeneral",
      url: SITE_URL,
      description: "A modern hiring marketplace for candidates and recruiters.",
    },
  ];
}
