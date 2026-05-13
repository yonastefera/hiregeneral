import type { Metadata } from "next";

import JobDetailsPage from "@/job-seekers/job/details/JobDetailsPage";
import { getJobDetailsPageData } from "@/job-seekers/job/details/job-details-data";
import { compactText } from "@/job-seekers/job/details/job-details-utils";

type JobDetailsRouteProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function generateMetadata({
  params,
}: JobDetailsRouteProps): Promise<Metadata> {
  const { jobId } = await params;
  const { job } = await getJobDetailsPageData(jobId);

  if (!job) {
    return {
      title: "Job Not Found | Your Site Name",
      description: "This job listing is no longer available.",
      alternates: {
        canonical: `/job/${jobId}`,
      },
    };
  }

  const title = job.enrichment?.display_title ?? job.title;
  const description = compactText(job.enrichment?.summary ?? job.description);

  return {
    title: `${title} at ${job.company_name} | Your Site Name`,
    description:
      description.length > 160
        ? `${description.slice(0, 157).trim()}...`
        : description,
    alternates: {
      canonical: `/job/${job.slug ?? job.id}`,
    },
    openGraph: {
      title: `${title} at ${job.company_name}`,
      description:
        description.length > 160
          ? `${description.slice(0, 157).trim()}...`
          : description,
      url: `/job/${job.slug ?? job.id}`,
      type: "article",
    },
  };
}

export default async function JobDetailsRoute({
  params,
}: JobDetailsRouteProps) {
  const { jobId } = await params;

  return <JobDetailsPage jobId={jobId} />;
}
