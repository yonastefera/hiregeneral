import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const employerCandidateSources = [
  "src/employer/dashboard/candidates/employer-candidates-data.ts",
  "src/employer/dashboard/database/employer-resume-database-data.ts",
];

const protectedDemographicColumns = [
  "gender",
  "gender_self_describe",
  "ethnicity",
  "ethnicity_self_describe",
  "veteran_status",
  "disability_status",
];

describe("employer demographic-data boundary", () => {
  it.each(employerCandidateSources)(
    "does not expose protected demographics through %s",
    (sourcePath) => {
      const source = fs.readFileSync(path.resolve(sourcePath), "utf8");

      for (const column of protectedDemographicColumns) {
        expect(source).not.toMatch(new RegExp(`\\b${column}\\b`, "i"));
      }
    },
  );
});
