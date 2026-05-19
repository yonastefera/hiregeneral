import type { Metadata } from "next";

import { getEmployerJobsPage } from "@/employer/dashboard/jobs/employer-jobs-data";
import { JobsPage } from "@/employer/dashboard/jobs/JobsPage";

export const metadata: Metadata = {
  title: "Jobs — HireGeneral",
  description: "Manage your posted, drafted, and closed roles on HireGeneral.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EmployerJobsRoute() {
  const result = await getEmployerJobsPage();

  return <JobsPage initialData={result.data} />;
}
