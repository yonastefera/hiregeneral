import type { Metadata } from "next";

import { PostJobPage } from "@/employer/dashboard/post-job/PostJobPage";

export const metadata: Metadata = {
  title: "Post a Job — HireGeneral",
  description:
    "Create a new job post, set role details, benefits, pay range, and candidate notifications on HireGeneral.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmployerPostJobRoute() {
  return <PostJobPage />;
}
