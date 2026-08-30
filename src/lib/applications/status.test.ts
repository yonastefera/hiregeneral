import { describe, expect, it } from "vitest";

import { employerApplicationUpdateSchema } from "./status";

describe("employerApplicationUpdateSchema", () => {
  it("accepts an employer status with a bounded response", () => {
    expect(
      employerApplicationUpdateSchema.safeParse({
        status: "interview",
        note: "We would like to schedule a conversation.",
      }).success,
    ).toBe(true);
  });

  it("rejects applicant-only and unknown statuses", () => {
    expect(
      employerApplicationUpdateSchema.safeParse({ status: "withdrawn" })
        .success,
    ).toBe(false);
  });
});
