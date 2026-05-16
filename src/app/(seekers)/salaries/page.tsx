import type { Metadata } from "next";

import SalariesPage from "@/job-seekers/salaries/SalariesPage";

export const metadata: Metadata = {
  title: "Salaries | HireGeneral",
  description:
    "Estimate salary ranges by career name and US location using active HireGeneral salary postings.",
  alternates: {
    canonical: "/salaries",
  },
  openGraph: {
    title: "Salaries | HireGeneral",
    description:
      "Estimate salary ranges by career name and US location using active HireGeneral salary postings.",
    url: "/salaries",
    type: "website",
  },
};

export default function SalariesRoute() {
  return <SalariesPage />;
}
