import { describe, expect, it } from "vitest";

import {
  buildJobsApiParams,
  DEFAULT_POSTED,
  parseJobsSearchParams,
  postedOptions,
} from "./search-options";

describe("public jobs search defaults", () => {
  it("uses a 30-day company-balanced result window", () => {
    const state = parseJobsSearchParams();
    const params = buildJobsApiParams(state);

    expect(DEFAULT_POSTED).toBe("30");
    expect(state.dateFilter).toBe("30");
    expect(params.get("daysAgo")).toBe("30");
    expect(params.get("balance")).toBe("company");
  });

  it("does not offer the retired 60-day preset", () => {
    expect(postedOptions.map((option) => String(option.value))).not.toContain(
      "60",
    );
  });

  it("uses a market category without narrowing it to the display label", () => {
    const state = parseJobsSearchParams({
      q: "Design",
      market: "design",
      posted: "3650",
    });
    const params = buildJobsApiParams(state);

    expect(state.query).toBe("Design");
    expect(params.get("query")).toBeNull();
    expect(params.get("category")).toBe("market:design");
    expect(params.get("daysAgo")).toBe("3650");
  });
});
