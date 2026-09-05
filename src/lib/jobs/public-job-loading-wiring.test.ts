import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

describe("public job loading", () => {
  it("does not invoke the application's own job APIs during server rendering", () => {
    const pageData = source(
      "../../job-seekers/job/details/job-details-data.ts",
    );

    expect(pageData).not.toContain("/api/jobs");
    expect(pageData).toContain("loadPublicJobDetail");
    expect(pageData).toContain("loadRelatedPublicJobs");
  });

  it("memoizes job details across metadata and page rendering", () => {
    const pageData = source(
      "../../job-seekers/job/details/job-details-data.ts",
    );

    expect(pageData).toContain("cache(loadPublicJobDetail)");
  });
});
