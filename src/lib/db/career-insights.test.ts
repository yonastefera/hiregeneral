import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260830193000_current_profile_skill_opportunities.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const salaryCard = readFileSync(
  fileURLToPath(
    new URL(
      "../../job-seekers/career-insights/CareerSalaryInsight.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("private career insights", () => {
  it("derives opportunities from the current profile and reviewed graph", () => {
    expect(migration).toContain("WHERE user_id = auth.uid()");
    expect(migration).toContain("public.knowledge_title_skills");
    expect(migration).toContain("public.job_knowledge_skills");
  });

  it("uses only active jobs for demand evidence", () => {
    expect(migration).toContain("job.status = 'published'");
    expect(migration).toContain(
      "job.expires_at IS NULL OR job.expires_at > now()",
    );
  });

  it("blocks anonymous execution", () => {
    expect(migration).toContain("FROM PUBLIC, anon;");
    expect(migration).toContain("TO authenticated;");
    expect(migration).not.toContain("SECURITY DEFINER");
  });

  it("does not present unsourced fallback salary estimates", () => {
    expect(salaryCard).toContain('data?.source === "benchmark"');
    expect(salaryCard).toContain("not enough sourced salary evidence");
  });
});
