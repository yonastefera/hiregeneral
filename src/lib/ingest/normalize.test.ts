import { describe, expect, it, vi } from "vitest";

import {
  defaultExpiryDate,
  detectWorkMode,
  importedJobSlug,
  normalizeEmploymentType,
  safeDescription,
  slugify,
} from "@/lib/ingest/normalize";

describe("job and ATS normalization", () => {
  it("creates stable URL-safe imported job slugs", () => {
    expect(slugify("R&D / Platform Engineer")).toBe(
      "r-and-d-platform-engineer",
    );
    expect(
      importedJobSlug({
        companyName: "Acme & Co.",
        title: "Senior Engineer",
        sourceName: "Greenhouse",
        sourceId: "123/ABC",
      }),
    ).toBe("acme-and-co-senior-engineer-greenhouse-123-abc");
  });

  it.each([
    ["Engineer", "Remote - US", "Remote"],
    ["Hybrid Designer", "Boston", "Hybrid"],
    ["Accountant", "New York", "On-site"],
  ])("detects work mode", (title, location, expected) => {
    expect(detectWorkMode(title, location)).toBe(expected);
  });

  it.each([
    ["part time", "Part-time"],
    ["contractor", "Contract"],
    ["summer intern", "Internship"],
    [null, "Full-time"],
  ])("normalizes employment types", (value, expected) => {
    expect(normalizeEmploymentType(value)).toBe(expected);
  });

  it("strips HTML and supplies a safe fallback description", () => {
    expect(
      safeDescription({
        description: "<p>Build <strong>safe</strong> systems.</p>",
        title: "Engineer",
        companyName: "Acme",
      }),
    ).toBe("Build safe systems.");
    expect(safeDescription({ title: "Engineer", companyName: "Acme" })).toBe(
      "Engineer role at Acme.",
    );
  });

  it("creates the configured expiration date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T12:00:00Z"));
    expect(defaultExpiryDate(30)).toBe("2026-09-08T12:00:00.000Z");
    vi.useRealTimers();
  });
});
