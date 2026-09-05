import { afterEach, describe, expect, it } from "vitest";
import type { JobSource } from "./job-sources";
import { ingestionBatchSize, selectScheduledSources } from "./source-scheduler";

function source(sourceType: JobSource["sourceType"], sourceSlug: string) {
  return {
    id: sourceSlug,
    companyName: sourceSlug,
    companyDomain: null,
    metadata: {},
    sourceType,
    sourceSlug,
    enabled: true,
  } satisfies JobSource;
}

afterEach(() => {
  delete process.env.INGEST_SOURCE_BATCH_SIZE;
});

describe("source scheduling", () => {
  it("runs never-attempted and oldest-attempted sources first", () => {
    const sources = [
      source("lever", "newer"),
      source("greenhouse", "never"),
      source("workday", "older"),
    ];

    const selected = selectScheduledSources(
      sources,
      [
        {
          sourceName: "lever",
          sourceSlug: "newer",
          lastAttemptAt: "2026-09-01T00:00:00.000Z",
        },
        {
          sourceName: "workday",
          sourceSlug: "older",
          lastAttemptAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      2,
    );

    expect(selected.map((item) => item.sourceSlug)).toEqual(["never", "older"]);
  });

  it("bounds configuration to a safe maximum", () => {
    process.env.INGEST_SOURCE_BATCH_SIZE = "500";
    expect(ingestionBatchSize()).toBe(50);
  });
});
