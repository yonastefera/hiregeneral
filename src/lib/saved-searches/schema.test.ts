import { describe, expect, it } from "vitest";

import {
  savedSearchFieldsSchema,
  toSavedSearchInsert,
  toSavedSearchUpdate,
  updateSavedSearchSchema,
} from "./schema";

describe("saved search input", () => {
  it("normalizes a complete search", () => {
    const fields = savedSearchFieldsSchema.parse({
      name: "  Remote platform roles  ",
      query: " platform engineer ",
      location: " United States ",
      postedDays: 7,
      distanceMiles: 50,
      workMode: "Remote",
      easyApply: true,
      alertFrequency: "daily",
    });

    expect(toSavedSearchInsert(fields, "user-1")).toEqual({
      user_id: "user-1",
      name: "Remote platform roles",
      query: "platform engineer",
      location: "United States",
      posted_days: 7,
      distance_miles: 50,
      work_mode: "Remote",
      easy_apply: true,
      alert_frequency: "daily",
    });
  });

  it("rejects unsupported filters and frequencies", () => {
    expect(
      savedSearchFieldsSchema.safeParse({
        name: "Unsafe",
        workMode: "Anywhere",
        alertFrequency: "hourly",
      }).success,
    ).toBe(false);
  });

  it("updates only supplied fields", () => {
    const update = updateSavedSearchSchema.parse({ alertFrequency: "off" });
    expect(toSavedSearchUpdate(update)).toMatchObject({
      alert_frequency: "off",
    });
    expect(toSavedSearchUpdate(update)).not.toHaveProperty("name");
  });
});
