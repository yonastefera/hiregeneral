import type { Job } from "@/lib/db/types";
import {
  compactText,
  formatSalary,
  getDisplayTitle,
} from "./job-details-utils";

type JobPostingJsonLdProps = {
  job: Job;
};

export default function JobPostingJsonLd({ job }: JobPostingJsonLdProps) {
  const title = getDisplayTitle(job);
  const salary = formatSalary(
    job.salary_min,
    job.salary_max,
    job.salary_currency,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description: compactText(job.description),
    datePosted: job.posted_at ?? undefined,
    employmentType: job.employment_type ?? undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name,
      sameAs: job.company_website ?? undefined,
      logo: job.company_logo_url ?? undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
      },
    },
    applicantLocationRequirements:
      job.work_mode?.toLowerCase() === "remote"
        ? {
            "@type": "Country",
            name: "United States",
          }
        : undefined,
    baseSalary:
      job.salary_min || job.salary_max
        ? {
            "@type": "MonetaryAmount",
            currency: job.salary_currency ?? "USD",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary_min ?? undefined,
              maxValue: job.salary_max ?? undefined,
              unitText: "YEAR",
            },
          }
        : undefined,
    directApply: !job.apply_url,
    url: `/job/${job.slug ?? job.id}`,
    salaryCurrency: job.salary_currency ?? (salary ? "USD" : undefined),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
