import { describe, expect, it } from "vitest";

import { buildBenchmarkLocationConstraint } from "./benchmark-location-filter";

describe("salary benchmark location constraint", () => {
  it.each(["", "remote", "United States"])(
    "uses only national benchmarks for %j",
    (location) => {
      expect(
        buildBenchmarkLocationConstraint({
          location,
          city: "",
          stateAbbr: "",
          stateName: "",
        }),
      ).toEqual({ kind: "national" });
    },
  );

  it("keeps national, city, and state candidates for a city lookup", () => {
    expect(
      buildBenchmarkLocationConstraint({
        location: "New York, NY",
        city: "New York",
        stateAbbr: "NY",
        stateName: "New York",
      }),
    ).toEqual({
      kind: "candidates",
      filter: "area_type.eq.N,state_code.eq.NY,area_name.ilike.%New York%",
    });
  });

  it("escapes PostgREST wildcard and separator characters", () => {
    expect(
      buildBenchmarkLocationConstraint({
        location: "100% City, N_Y",
        city: "100% City",
        stateAbbr: "N_Y",
        stateName: "Name, State",
      }),
    ).toEqual({
      kind: "candidates",
      filter:
        "area_type.eq.N,state_code.eq.N\\_Y,area_name.ilike.%100\\% City%,area_name.ilike.%Name  State%",
    });
  });
});
