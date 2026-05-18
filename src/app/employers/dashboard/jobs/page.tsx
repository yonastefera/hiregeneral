import type { Metadata } from "next";

import { JobsPage } from "@/employer/dashboard/jobs/JobsPage";

export const metadata: Metadata = {
  title: "Jobs — HireGeneral",
  description: "Manage your posted, drafted, and closed roles on HireGeneral.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerJobsRoute() {
  return <JobsPage />;
}
