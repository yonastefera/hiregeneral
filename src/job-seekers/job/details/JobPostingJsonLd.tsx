import type { Job } from "@/lib/db/types";
import { buildJobPostingSchema, isIndexableJob } from "@/lib/seo/job-posting";

type JobPostingJsonLdProps = {
  job: Job;
};

export default function JobPostingJsonLd({ job }: JobPostingJsonLdProps) {
  if (!isIndexableJob(job)) return null;

  const jsonLd = buildJobPostingSchema(job);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
