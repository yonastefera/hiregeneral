import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { JobSource } from "../job-sources";
import { extractAtomFeedJobs } from "./atom-feed";
import { parseAvatureJobs } from "./avature";
import { scraperFetchers } from "./index";
import type { WalmartJob } from "./walmart";
import {
  walmartApplyUrl,
  walmartDescription,
  walmartLocation,
  walmartPostedAt,
} from "./walmart";

const fixtureDirectory = fileURLToPath(
  new URL("./__fixtures__/", import.meta.url),
);

async function fixture(name: string) {
  return readFile(`${fixtureDirectory}${name}`, "utf8");
}

function source(overrides: Partial<JobSource> = {}): JobSource {
  return {
    id: "source-id",
    companyName: "Example",
    companyDomain: "example.com",
    metadata: {},
    sourceType: "scraper",
    sourceSlug: "example",
    sourceUrl: "https://jobs.example.com/search",
    enabled: true,
    ...overrides,
  };
}

describe("custom scraper adapter contracts", () => {
  it("registers every supported custom adapter", () => {
    expect(scraperFetchers.size).toBe(25);
    expect(scraperFetchers.has("avature")).toBe(true);
    expect(scraperFetchers.has("atom-feed")).toBe(true);
    expect(scraperFetchers.has("walmart")).toBe(true);
  });

  it("parses an Avature result fixture into its stable listing contract", async () => {
    const jobs = parseAvatureJobs(
      source({ sourceUrl: "https://careers.example.com/search" }),
      await fixture("avature-results.html"),
    );

    expect(jobs).toEqual([
      {
        title: "Senior Platform Engineer",
        applyUrl: "https://careers.example.com/careers/JobDetail/12345",
        location: "Atlanta, GA",
        employmentType: "Full Time",
        postedAt: "2026-08-21T00:00:00.000Z",
        jobId: "HG-123",
      },
    ]);
  });

  it("parses an Atom feed fixture and infers a US location", async () => {
    const jobs = extractAtomFeedJobs(
      await fixture("jobs.atom.xml"),
      "United States",
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      id: "job-42",
      title: "Software Engineer (Atlanta, GA)",
      href: "https://jobs.example.com/job-42",
      location: "Atlanta, GA",
      postedAt: "2026-08-21T12:00:00Z",
    });
  });

  it("normalizes stable fields from a Walmart response fixture", async () => {
    const job = JSON.parse(await fixture("walmart-job.json")) as WalmartJob;

    expect(walmartLocation(job.metadata)).toBe(
      "Bentonville, AR, United States",
    );
    expect(walmartPostedAt(job.metadata)).toBe("2026-08-21T12:00:00.000Z");
    expect(walmartApplyUrl(source(), job)).toBe(
      "https://careers.walmart.com/us/en/jobs/WD-2026-42",
    );
    expect(walmartDescription(job, "Platform Engineer")).toContain(
      "Build reliable commerce systems.",
    );
  });
});
