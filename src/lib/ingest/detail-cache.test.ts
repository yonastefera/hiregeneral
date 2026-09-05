import { describe, expect, it } from "vitest";
import type { ImportedJob } from "./normalize";
import { listingFingerprint } from "./detail-cache";

const job = {
  sourceName: "greenhouse",
  sourceId: "acme:1",
  title: "Engineer",
  description: "Listing summary",
  location: "Remote",
  employmentType: "Full-time",
  workMode: "Remote",
  salaryMin: null,
  salaryMax: null,
  postedAt: "2026-09-01T00:00:00.000Z",
  applyUrl: "https://example.com/jobs/1",
} as ImportedJob;

describe("listingFingerprint", () => {
  it("is stable for an unchanged listing", () => {
    expect(listingFingerprint(job, job.applyUrl)).toBe(
      listingFingerprint({ ...job }, job.applyUrl),
    );
  });

  it("changes when content relevant to the detail page changes", () => {
    expect(listingFingerprint(job, job.applyUrl)).not.toBe(
      listingFingerprint({ ...job, title: "Senior Engineer" }, job.applyUrl),
    );
  });
});
