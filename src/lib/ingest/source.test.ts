import { describe, expect, it } from "vitest";
import type { ImportedJob } from "./normalize";
import { deduplicateImportedJobs } from "./source";

describe("deduplicateImportedJobs", () => {
  it("keeps the last version of a repeated source id", () => {
    const first = { sourceId: "source:1", title: "Old" } as ImportedJob;
    const latest = { sourceId: "source:1", title: "Latest" } as ImportedJob;
    const other = { sourceId: "source:2", title: "Other" } as ImportedJob;

    expect(deduplicateImportedJobs([first, other, latest])).toEqual({
      jobs: [latest, other],
      duplicateCount: 1,
    });
  });
});
