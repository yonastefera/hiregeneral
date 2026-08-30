import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260830180000_personalized_job_ranking.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const resultsPage = readFileSync(
  fileURLToPath(
    new URL(
      "../../job-seekers/job/listing/JobsResultsList.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("personalized job ranking", () => {
  it("derives private profile evidence from the authenticated user", () => {
    expect(migration).toContain("SELECT auth.uid() AS user_id");
    expect(migration).toContain("profiles.user_id = actor.user_id");
    expect(migration).not.toContain("p_user_id");
  });

  it("bounds candidates and rechecks public job availability", () => {
    expect(migration).toContain("p_job_ids[1:25]");
    expect(migration).toContain("job.status = 'published'");
    expect(migration).toContain(
      "job.expires_at IS NULL OR job.expires_at > now()",
    );
  });

  it("keeps profile ranking unavailable to anonymous callers", () => {
    expect(migration).toContain("FROM PUBLIC, anon;");
    expect(migration).toContain("TO authenticated;");
    expect(migration).not.toContain("SECURITY DEFINER");
  });

  it("reranks the page and preserves a local rolling-deployment fallback", () => {
    expect(resultsPage).toContain('"rank_jobs_for_current_profile"');
    expect(resultsPage).toContain(
      "explainJobMatch(profile as MatchProfile, job)",
    );
    expect(resultsPage).toContain("matchExplanations.get(right.id)?.score");
  });
});
