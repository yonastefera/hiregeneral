import { describe, expect, it } from "vitest";

import { textPreview, toCompactJobListItem } from "./list-item";

const sourceJob = {
  id: "job-1",
  company_name: "Example",
  company_logo_url: null,
  company_tagline: null,
  company_size: null,
  company_website: null,
  title: "Engineer",
  description: `<p>${"Detailed description ".repeat(500)}</p>`,
  location: "Remote",
  employment_type: "Full-time",
  work_mode: "remote",
  experience_level: "Mid level",
  category: "Engineering",
  salary_min: 100000,
  salary_max: 140000,
  salary_currency: "USD",
  skills: ["TypeScript"],
  slug: "engineer-example",
  source_name: "Example ATS",
  apply_url: "https://example.com/apply",
  posted_at: "2026-09-05T00:00:00.000Z",
  applicant_count: 4,
};

describe("compact job list items", () => {
  it("returns a plain-text preview instead of a complete description", () => {
    const preview = textPreview(sourceJob.description);

    expect(preview).not.toContain("<p>");
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(481);
  });

  it("omits detail-only and internal fields", () => {
    const item = toCompactJobListItem(sourceJob, {
      job_id: sourceJob.id,
      display_title: "Software Engineer",
      display_location: "United States",
      summary: "Short role summary.",
    });

    expect(item).not.toHaveProperty("responsibilities");
    expect(item).not.toHaveProperty("requirements");
    expect(item).not.toHaveProperty("benefits");
    expect(item).not.toHaveProperty("recruiter_id");
    expect(item.enrichment).toEqual({
      display_title: "Software Engineer",
      display_location: "United States",
      summary: "Short role summary.",
    });
  });

  it("keeps a 20-card response within a bounded payload size", () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      toCompactJobListItem({ ...sourceJob, id: `job-${index}` }),
    );
    const bytes = Buffer.byteLength(JSON.stringify({ data: items }), "utf8");

    expect(bytes).toBeLessThan(40_000);
  });
});
