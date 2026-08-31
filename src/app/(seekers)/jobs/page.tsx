import type { Metadata } from "next";

import JobsPage from "@/job-seekers/job/listing/JobsPage";

const jobsMetadata: Metadata = {
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

export async function generateMetadata({
  searchParams,
}: JobsRouteProps): Promise<Metadata> {
  const parameters = await searchParams;
  const hasFilters = Boolean(parameters && Object.keys(parameters).length > 0);

  return {
    ...jobsMetadata,
    robots: {
      index: !hasFilters,
      follow: true,
    },
  };
}

export default function Jobs({ searchParams }: JobsRouteProps) {
  return <JobsPage searchParams={searchParams} />;
}
