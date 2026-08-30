import { describe, expect, it } from "vitest";

import { matchesSavedSearch, type AlertJob } from "./matching";

const job: AlertJob = {
  apply_url: null,
  category: "Engineering",
  company_name: "Example",
  description: "Build reliable cloud services.",
  location: "New York, NY",
  skills: ["TypeScript", "PostgreSQL"],
  title: "Senior Platform Engineer",
  work_mode: "Hybrid",
};

describe("saved search matching", () => {
  it("matches all keyword terms across explainable job fields", () => {
    expect(
      matchesSavedSearch(
        {
          query: "platform PostgreSQL",
          location: "New York",
          work_mode: "Hybrid",
          easy_apply: true,
        },
        job,
      ),
    ).toBe(true);
  });

  it("rejects incompatible work modes and external applications", () => {
    expect(
      matchesSavedSearch(
        {
          query: "platform",
          location: "",
          work_mode: "Remote",
          easy_apply: false,
        },
        job,
      ),
    ).toBe(false);
    expect(
      matchesSavedSearch(
        {
          query: "platform",
          location: "",
          work_mode: "Hybrid",
          easy_apply: true,
        },
        { ...job, apply_url: "https://example.com/apply" },
      ),
    ).toBe(false);
  });
});
