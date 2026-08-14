import { describe, expect, it } from "vitest";

import { buildJobsSearchParams } from "@/home/home-search-params";

describe("job search parameters", () => {
  it("prefers normalized selected values", () => {
    const params = buildJobsSearchParams({
      query: " ignored ",
      selectedKeyword: {
        term: "Software Engineer",
        label: "Software Engineer",
        category: null,
      },
      locationQuery: "ignored",
      selectedLocation: {
        label: "Boston, MA",
        city: "Boston",
        state: "MA",
        zip_code: "02108",
      },
    });

    expect(Object.fromEntries(params)).toEqual({
      query: "Software Engineer",
      city: "Boston",
      state: "MA",
      location: "Boston, MA",
      zip: "02108",
    });
  });

  it("trims free text and omits blank parameters", () => {
    expect(
      buildJobsSearchParams({
        query: "  nurse  ",
        selectedKeyword: null,
        locationQuery: "   ",
        selectedLocation: null,
      }).toString(),
    ).toBe("query=nurse");
  });
});