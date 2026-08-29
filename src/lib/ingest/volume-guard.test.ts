import { describe, expect, it } from "vitest";

import type { JobSource } from "./job-sources";
import { evaluateIngestionVolume } from "./volume-guard";

const source: JobSource = {
  id: "source-id",
  companyName: "Example",
  companyDomain: "example.com",
  metadata: {},
  sourceType: "scraper",
  sourceSlug: "example",
  enabled: true,
};

describe("ingestion volume guard", () => {
  it("allows normal source volume", () => {
    expect(
      evaluateIngestionVolume({
        source,
        currentValidJobs: 80,
        previousValidJobs: 100,
        publishedJobs: 90,
      }),
    ).toEqual({ allowStaleExpiration: true, reason: null });
  });

  it("blocks stale expiration after an abnormal source drop", () => {
    expect(
      evaluateIngestionVolume({
        source,
        currentValidJobs: 20,
        previousValidJobs: 100,
        publishedJobs: 90,
      }),
    ).toEqual({
      allowStaleExpiration: false,
      reason:
        "Stale expiration skipped: 20 valid jobs is 20.0% of the 100-job baseline.",
    });
  });

  it("uses the current published count when no successful run exists", () => {
    expect(
      evaluateIngestionVolume({
        source,
        currentValidJobs: 0,
        previousValidJobs: null,
        publishedJobs: 40,
      }).allowStaleExpiration,
    ).toBe(false);
  });

  it("does not close every job for a small source that unexpectedly returns zero", () => {
    expect(
      evaluateIngestionVolume({
        source,
        currentValidJobs: 0,
        previousValidJobs: 4,
        publishedJobs: 4,
      }).allowStaleExpiration,
    ).toBe(false);
  });

  it("allows explicit per-source thresholds", () => {
    expect(
      evaluateIngestionVolume({
        source: {
          ...source,
          metadata: {
            staleExpirationMinBaseline: 50,
            staleExpirationMinRatio: 0.2,
          },
        },
        currentValidJobs: 20,
        previousValidJobs: 100,
      }).allowStaleExpiration,
    ).toBe(true);
  });
});
