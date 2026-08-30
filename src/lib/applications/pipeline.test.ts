import { describe, expect, it } from "vitest";

import { pipelineConfigurationSchema } from "./pipeline";

describe("pipelineConfigurationSchema", () => {
  it("accepts an ordered employer pipeline", () => {
    expect(
      pipelineConfigurationSchema.safeParse({
        stages: [
          {
            id: null,
            name: "Phone screen",
            position: 0,
            applicationStatus: "reviewing",
          },
          {
            id: null,
            name: "On-site",
            position: 1,
            applicationStatus: "interview",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects duplicate names and gaps in stage order", () => {
    expect(
      pipelineConfigurationSchema.safeParse({
        stages: [
          {
            id: null,
            name: "Review",
            position: 0,
            applicationStatus: "reviewing",
          },
          {
            id: null,
            name: "review",
            position: 2,
            applicationStatus: "interview",
          },
        ],
      }).success,
    ).toBe(false);
  });
});
