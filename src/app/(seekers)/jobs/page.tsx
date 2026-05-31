import { Suspense } from "react";
import type { Metadata } from "next";

import JobsPage from "@/job-seekers/job/listing/JobsPage";

export const metadata: Metadata = {
  title: "Search Jobs | HireGeneral",
  description:
    "Browse job listings by title, skill, company, keyword, location, posted date, and distance.",
  alternates: {
    canonical: "/jobs",
  },
  openGraph: {
    title: "Search Jobs | HireGeneral",
    description:
      "Browse job listings by title, skill, company, keyword, location, posted date, and distance.",
    url: "/jobs",
    type: "website",
  },
};

type JobsRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default function Jobs({ searchParams }: JobsRouteProps) {
  return (
    <Suspense fallback={null}>
      <JobsPage searchParams={searchParams} />
    </Suspense>
  );
}
