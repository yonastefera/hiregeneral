import type { Metadata } from "next";

import JobDetailsPage from "@/job-seekers/job/details/JobDetailsPage";
import { getJobDetailsPageData } from "@/job-seekers/job/details/job-details-data";
import { compactText } from "@/job-seekers/job/details/job-details-utils";
import { getCanonicalJobPath } from "@/lib/seo/site";

type JobDetailsRouteProps = {
  params: Promise<{
    jobId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: JobDetailsRouteProps): Promise<Metadata> {
  const { jobId } = await params;
  const { job } = await getJobDetailsPageData(jobId);

  if (!job) {
    return {
      title: "Job Not Found | HireGeneral",
      description: "This job listing is no longer available.",
      alternates: {
        canonical: `/jobs/${jobId}`,
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = job.enrichment?.display_title ?? job.title;
  const description = compactText(job.enrichment?.summary ?? job.description);

  return {
    title: `${title} at ${job.company_name}`,
    description:
      description.length > 160
        ? `${description.slice(0, 157).trim()}...`
        : description,
    alternates: {
      canonical: getCanonicalJobPath(job),
    },
    openGraph: {
      title: `${title} at ${job.company_name}`,
      description:
        description.length > 160
          ? `${description.slice(0, 157).trim()}...`
          : description,
      url: getCanonicalJobPath(job),
      type: "article",
    },
  };
}

export default async function JobDetailsRoute({
  params,
  searchParams,
}: JobDetailsRouteProps) {
  const { jobId } = await params;
  const resolvedSearchParams = await searchParams;
  const from = Array.isArray(resolvedSearchParams?.from)
    ? resolvedSearchParams?.from[0]
    : resolvedSearchParams?.from;
  const backHref = from?.startsWith("/jobs") ? from : "/jobs";

  return <JobDetailsPage jobId={jobId} backHref={backHref} />;
}
