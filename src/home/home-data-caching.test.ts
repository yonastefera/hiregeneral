import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

describe("home data cost controls", () => {
  it("shares one persistent hourly insight cache across all consumers", () => {
    const insights = source("./home-insights.ts");

    expect(insights).toContain("unstable_cache(");
    expect(insights).toContain('["home-insights-v2"]');
    expect(insights).toContain("revalidate: 3600");
    expect(insights).toContain('.rpc("get_home_insights_public")');
    expect(insights).not.toContain("INSIGHT_LIMIT");
  });

  it("loads featured cards through the compact database projection", () => {
    const indexData = source("./index-data.ts");

    expect(indexData).toContain('rpc("search_job_cards_public"');
    expect(indexData).not.toContain("HOME_JOB_SELECT");
    expect(indexData).not.toContain("JOB_ENRICHMENT_SELECT");
    expect(indexData).not.toContain('.from("jobs")');
  });

  it("caches the complete homepage data result", () => {
    const indexData = source("./index-data.ts");

    expect(indexData).toContain('["home-index-data-v1"]');
    expect(indexData).toContain('tags: ["home-index-data", "home-insights"]');
  });

  it("keeps one combined insight endpoint instead of duplicate split routes", () => {
    expect(() => source("../app/api/home/insights/route.ts")).not.toThrow();
    expect(() =>
      source("../app/api/home/market-categories/route.ts"),
    ).toThrow();
    expect(() => source("../app/api/home/salary-insights/route.ts")).toThrow();
  });
});
