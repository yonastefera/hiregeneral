import { describe, expect, it } from "vitest";

import { explainJobMatch } from "./match-explanation";

describe("explainJobMatch", () => {
  it("explains matching skills, title, location, and experience", () => {
    const result = explainJobMatch(
      {
        headline: "Senior Platform Engineer",
        level_of_experience: "Senior",
        location: "New York",
        skills: ["TypeScript", "PostgreSQL", "Kubernetes"],
      },
      {
        title: "Senior Platform Engineer",
        skills: ["PostgreSQL", "Kubernetes", "Go"],
        location: "New York, NY",
        experience_level: "Senior level",
      },
    );

    expect(result?.label).toBe("Strong match");
    expect(result?.reasons).toContain("PostgreSQL, Kubernetes skills match");
    expect(result?.reasons).toContain("Role title aligns with your profile");
  });

  it("returns no explanation without positive profile signals", () => {
    expect(
      explainJobMatch(
        {
          headline: null,
          level_of_experience: null,
          location: null,
          skills: [],
        },
        {
          title: "Accountant",
          skills: ["Accounting"],
          location: "Chicago, IL",
          experience_level: null,
        },
      ),
    ).toBeNull();
  });
});
