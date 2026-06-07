import type { Metadata } from "next";

import EmployerLandingPage from "@/employer/landing/EmployerLandingPage";

export const metadata: Metadata = {
  title: "For Employers | HireGeneral",
  description:
    "Hire faster on HireGeneral. Post roles, browse qualified talent, and reach candidates from a modern employer marketplace.",
  alternates: {
    canonical: "/employers",
  },
  openGraph: {
    title: "For Employers | HireGeneral",
    description:
      "Post roles and reach qualified candidates on the modern HireGeneral employer marketplace.",
    url: "/employers",
    siteName: "HireGeneral",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "For Employers | HireGeneral",
    description:
      "Post roles, browse qualified talent, and hire faster with HireGeneral.",
  },
};

export default function EmployersPage() {
  return <EmployerLandingPage />;
}
