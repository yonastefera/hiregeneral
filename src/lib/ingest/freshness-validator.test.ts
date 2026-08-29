import { describe, expect, it } from "vitest";
import type { ImportedJob } from "./normalize";
import { validateJobFreshness } from "./freshness-validator";

function job(sourceId: string, postedAt: string, expiresAt: string | null) {
  return { sourceId, postedAt, expiresAt } as ImportedJob;
}

describe("validateJobFreshness", () => {
  it("rejects already expired and implausibly future jobs", () => {
    const result = validateJobFreshness(
      [
        job("expired", "2026-08-01T00:00:00Z", "2026-08-28T00:00:00Z"),
        job("future", "2026-09-02T00:00:00Z", null),
        job("active", "2026-08-28T00:00:00Z", "2026-09-30T00:00:00Z"),
      ],
      new Date("2026-08-29T00:00:00Z"),
    );

    expect(result.jobs.map((item) => item.sourceId)).toEqual(["active"]);
    expect(result.issues).toEqual([
      { sourceId: "expired", reason: "already_expired" },
      { sourceId: "future", reason: "future_posted_at" },
    ]);
  });
});
