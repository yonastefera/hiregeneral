import { Suspense } from "react";
import type { Metadata } from "next";

import JobsPage from "@/job-seekers/job/listing/JobsPage";

export const metadata: Metadata = {
  title: "Search Jobs | HireGeneral",
  description:
    "Browse job listings by title, skill, company, keyword, location, posted date, and distance.",
  alternates: {
    canonical: "/job",
  },
  openGraph: {
    title: "Search Jobs | HireGeneral",
    description:
      "Browse job listings by title, skill, company, keyword, location, posted date, and distance.",
    url: "/job",
    type: "website",
  },
};

export default function Jobs() {
  return (
    <Suspense fallback={null}>
      <JobsPage />
    </Suspense>
  );
}
