import type { Metadata } from "next";

import SavedJobsPage from "@/job-seekers/saved/SavedJobs";

export const metadata: Metadata = {
  title: "Saved & Applied Jobs | HireGeneral",
  description:
    "View your saved jobs and submitted applications on HireGeneral.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SavedJobsPageRoute() {
  return <SavedJobsPage />;
}
