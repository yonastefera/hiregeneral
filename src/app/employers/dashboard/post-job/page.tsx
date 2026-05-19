import type { Metadata } from "next";

import { getEmployerJobForEdit } from "@/employer/dashboard/jobs/employer-jobs-data";
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

type EmployerPostJobRouteProps = {
  searchParams?: Promise<{
    jobId?: string;
    id?: string;
  }>;
};

export default async function EmployerPostJobRoute({
  searchParams,
}: EmployerPostJobRouteProps) {
  const params = await searchParams;
  const jobId = params?.jobId ?? params?.id;
  const initialJob = jobId ? await getEmployerJobForEdit(jobId) : null;

  return <PostJobPage initialJob={initialJob} />;
}
