import { describe, expect, it } from "vitest";

import { interviewScorecardSchema } from "./scorecard";

describe("interviewScorecardSchema", () => {
  it("accepts structured interview feedback", () => {
    expect(
      interviewScorecardSchema.safeParse({
        interviewRound: "Technical interview",
        recommendation: "yes",
        overallRating: 4,
        criteria: [
          { name: "Problem solving", rating: 5, note: "Clear approach" },
        ],
        summary: "Advance",
      }).success,
    ).toBe(true);
  });

  it("requires at least one bounded criterion", () => {
    expect(
      interviewScorecardSchema.safeParse({
        interviewRound: "Screen",
        recommendation: "yes",
        overallRating: 4,
        criteria: [],
      }).success,
    ).toBe(false);
  });
});
