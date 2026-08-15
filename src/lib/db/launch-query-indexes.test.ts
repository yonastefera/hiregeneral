import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../migrations/20260815150000_add_launch_query_indexes.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("launch query indexes", () => {
  it.each([
    "idx_jobs_recruiter_created_at",
    "idx_jobs_recruiter_status_created_at",
    "idx_applications_user_created_at",
    "idx_applications_job_created_at",
    "idx_conversations_participant_one_activity",
    "idx_conversations_participant_two_activity",
    "idx_saved_jobs_user_created_at",
  ])("creates %s idempotently", (indexName) => {
    expect(migration).toContain(`CREATE INDEX IF NOT EXISTS ${indexName}`);
  });

  it("matches the ordering used by each authenticated list", () => {
    expect(migration).toContain("(recruiter_id, created_at DESC)");
    expect(migration).toContain("(recruiter_id, status, created_at DESC)");
    expect(migration).toContain("(user_id, created_at DESC)");
    expect(migration).toContain("(job_id, created_at DESC)");
    expect(migration).toContain("(participant_one, last_message_at DESC)");
    expect(migration).toContain("(participant_two, last_message_at DESC)");
  });
});
