import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { isUsText } from "./filters";

describe("U.S. job-location filtering", () => {
  it.each([
    "United States",
    "Remote - US",
    "Atlanta, GA",
    "Austin, TX 78701",
    "New York, New York",
  ])("accepts %s", (location) => {
    expect(isUsText(location)).toBe(true);
  });

  it.each([
    "Hyderabad TS IN 26",
    "Bengaluru, Karnataka, India",
    "Toronto, Ontario, Canada",
    "London, United Kingdom",
    "Remote",
  ])("rejects %s", (location) => {
    expect(isUsText(location)).toBe(false);
  });

  it("ships a cleanup migration for previously published Indian jobs", () => {
    const migration = readFileSync(
      fileURLToPath(
        new URL(
          "../migrations/20261009071000_close_non_us_published_jobs.sql",
          import.meta.url,
        ),
      ),
      "utf8",
    );

    expect(migration).toContain("status = 'closed'");
    expect(migration).toContain("india|hyderabad|telangana");
    expect(migration).toContain("WHERE status = 'published'");
  });
});
