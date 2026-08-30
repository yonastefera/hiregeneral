import { describe, expect, it } from "vitest";

import { getJobTrustIndicators } from "./trust-indicators";

describe("getJobTrustIndicators", () => {
  it("marks fresh first-party applications", () => {
    expect(getJobTrustIndicators({ postedDaysAgo: 0 })).toEqual([
      { label: "Fresh posting", tone: "fresh" },
      { label: "Apply on HireGeneral", tone: "trusted" },
    ]);
  });

  it("describes sourced external applications without overstating verification", () => {
    expect(
      getJobTrustIndicators({
        postedDaysAgo: 10,
        applyUrl: "https://company.example/jobs/1",
        sourceName: "workday",
      }),
    ).toEqual([{ label: "Company application", tone: "trusted" }]);
  });
});
