import { describe, expect, it } from "vitest";

import { buildApplicationDefaults } from "./application-defaults";

describe("buildApplicationDefaults", () => {
  it("maps owned profile data into application defaults", () => {
    expect(
      buildApplicationDefaults(
        {
          full_name: "Ada Lovelace",
          email: null,
          phone: "555-0100",
          location: "New York, NY",
          level_of_experience: "Senior",
          profile_links: [
            { id: "1", label: "LinkedIn", url: "https://linkedin.com/in/ada" },
          ],
          resume_url: "user-1/resume.pdf",
          resume_file_name: "Ada Resume.pdf",
        },
        "ada@example.com",
        "user-1",
      ),
    ).toMatchObject({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      linkedin: "https://linkedin.com/in/ada",
      yearsExp: "5-7",
      resumePath: "user-1/resume.pdf",
    });
  });

  it("rejects a resume path outside the authenticated user's folder", () => {
    const defaults = buildApplicationDefaults(
      {
        full_name: null,
        email: null,
        phone: null,
        location: null,
        level_of_experience: null,
        profile_links: [],
        resume_url: "another-user/resume.pdf",
        resume_file_name: "resume.pdf",
      },
      "person@example.com",
      "user-1",
    );

    expect(defaults.resumePath).toBeNull();
  });
});
