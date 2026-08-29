import { describe, expect, it, vi } from "vitest";
import { isSafeApplyUrl, validateApplyLinks } from "./apply-link-validator";
import type { ImportedJob } from "./normalize";

const job = (sourceId: string, applyUrl: string) =>
  ({ sourceId, applyUrl }) as ImportedJob;

describe("apply-link validation", () => {
  it("rejects non-http and private-network URLs", () => {
    expect(isSafeApplyUrl("ftp://jobs.example.com/1")).toBe(false);
    expect(isSafeApplyUrl("http://127.0.0.1/admin")).toBe(false);
    expect(isSafeApplyUrl("https://jobs.example.com/1")).toBe(true);
  });

  it("removes confirmed missing links but keeps transient failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 404 }))
        .mockResolvedValueOnce(new Response(null, { status: 503 })),
    );

    const result = await validateApplyLinks(
      [
        job("missing", "https://jobs.example.com/missing"),
        job("down", "https://jobs.example.com/down"),
      ],
      { concurrency: 1 },
    );

    expect(result.jobs.map((item) => item.sourceId)).toEqual(["down"]);
    expect(result.issues.map((issue) => issue.reason)).toEqual([
      "not_found",
      "unreachable",
    ]);
    vi.unstubAllGlobals();
  });
});
