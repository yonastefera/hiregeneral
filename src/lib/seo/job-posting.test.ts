import { afterEach, describe, expect, it } from "vitest";

import type { Job } from "@/lib/db/types";
import { buildJobPostingSchema, isIndexableJob } from "./job-posting";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const job: Job = {
  id: "job-1",
  recruiter_id: "recruiter-1",
  company_id: "company-1",
  company_name: "Example Company",
  company_logo_url: "https://example.com/logo.png",
  company_tagline: null,
  company_size: null,
  company_website: "https://example.com",
  title: "Software Engineer",
  description: "<p>Build reliable products.</p>",
  responsibilities: [],
  requirements: [],
  benefits: [],
  location: "United States",
  latitude: null,
  longitude: null,
  employment_type: "Full-time",
  work_mode: "Remote",
  experience_level: null,
  category: null,
  salary_min: 100_000,
  salary_max: 140_000,
  salary_currency: "USD",
  skills: [],
  status: "published",
  slug: "software-engineer-example-company",
  source_name: null,
  source_id: null,
  apply_url: null,
  posted_at: "2026-08-01T00:00:00.000Z",
  expires_at: "2026-10-01T00:00:00.000Z",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-02T00:00:00.000Z",
};

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("job posting discovery", () => {
  it("excludes closed and expired jobs from structured discovery", () => {
    expect(isIndexableJob(job, new Date("2026-08-30T00:00:00.000Z"))).toBe(
      true,
    );
    expect(isIndexableJob({ ...job, status: "closed" })).toBe(false);
    expect(isIndexableJob(job, new Date("2026-10-02T00:00:00.000Z"))).toBe(
      false,
    );
  });

  it("builds an absolute, canonical remote JobPosting schema", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://jobs.hiregeneral.test/path";

    expect(buildJobPostingSchema(job)).toMatchObject({
      "@type": "JobPosting",
      employmentType: "FULL_TIME",
      validThrough: job.expires_at,
      jobLocationType: "TELECOMMUTE",
      jobLocation: undefined,
      directApply: true,
      url: "https://jobs.hiregeneral.test/jobs/software-engineer-example-company",
      baseSalary: {
        currency: "USD",
        value: {
          minValue: 100_000,
          maxValue: 140_000,
          unitText: "YEAR",
        },
      },
    });
  });
});
