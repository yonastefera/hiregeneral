import type { Metadata } from "next";

import ApplyJobPage from "@/job-seekers/job/apply/ApplyJobPage";
import { getApplyJobData } from "@/job-seekers/job/apply/apply-data";

type ApplyJobRouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function generateMetadata({
  params,
}: ApplyJobRouteProps): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getApplyJobData(jobId);

  if (!job) {
    return {
      title: "Apply for Job | HireGeneral",
      description: "Apply for a job on HireGeneral.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = job.enrichment?.display_title ?? job.title;

  return {
    title: `Apply for ${title} at ${job.company_name} | HireGeneral`,
    description: `Submit your application for ${title} at ${job.company_name}.`,
    alternates: {
      canonical: `/jobs/${job.slug ?? job.id}/apply`,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `Apply for ${title} at ${job.company_name}`,
      description: `Submit your application for ${title} at ${job.company_name}.`,
      url: `/jobs/${job.slug ?? job.id}/apply`,
      type: "website",
    },
  };
}

export default async function ApplyJobRoute({ params }: ApplyJobRouteProps) {
  const { jobId } = await params;

  return <ApplyJobPage jobId={jobId} />;
}
