import { describe, expect, it } from "vitest";

import { parseResumeSuggestions } from "./parser";

describe("parseResumeSuggestions", () => {
  it("extracts conservative application suggestions", () => {
    expect(
      parseResumeSuggestions(`
        Jane Person | jane@example.com | (212) 555-0198
        linkedin.com/in/jane-person | github.com/janeperson
        Software engineer with 6 years of experience.
      `),
    ).toEqual({
      email: "jane@example.com",
      phone: "(212) 555-0198",
      linkedin: "https://linkedin.com/in/jane-person",
      portfolio: "https://github.com/janeperson",
      yearsExperience: "5-7",
    });
  });

  it("returns nulls rather than inventing missing details", () => {
    expect(parseResumeSuggestions("Experienced product designer.")).toEqual({
      email: null,
      phone: null,
      linkedin: null,
      portfolio: null,
      yearsExperience: null,
    });
  });
});
