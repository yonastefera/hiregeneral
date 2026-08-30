import { describe, expect, it } from "vitest";

import { buildApplicationAssistant } from "./application-assistant";

const job = {
  title: "Platform Engineer",
  company_name: "Example Co",
  skills: ["TypeScript", "PostgreSQL", "Go"],
  requirements: ["Build reliable services"],
};

describe("buildApplicationAssistant", () => {
  it("uses only matching skills already recorded on the profile", () => {
    const result = buildApplicationAssistant(
      {
        headline: "Backend engineer",
        skills: ["TypeScript", "PostgreSQL", "Kubernetes"],
      },
      job,
    );

    expect(result.matchedSkills).toEqual(["TypeScript", "PostgreSQL"]);
    expect(result.starter).toContain("Backend engineer");
    expect(result.starter).not.toContain("Go");
    expect(result.starter).not.toMatch(/years|expert|led/i);
  });

  it("does not invent evidence when the profile is incomplete", () => {
    const result = buildApplicationAssistant(
      { headline: null, skills: [] },
      job,
    );

    expect(result.matchedSkills).toEqual([]);
    expect(result.starter).toBe(
      "I am interested in the Platform Engineer role at Example Co.",
    );
    expect(result.prompts[0]).toContain("verified skill");
  });

  it("deduplicates profile evidence deterministically", () => {
    const result = buildApplicationAssistant(
      { headline: null, skills: ["TypeScript", " typescript "] },
      job,
    );

    expect(result.matchedSkills).toEqual(["TypeScript"]);
  });
});
