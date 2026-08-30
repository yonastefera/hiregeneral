import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260830150000_skills_title_knowledge_graph.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const ingestion = readFileSync(
  fileURLToPath(new URL("../ingest/upsert-jobs.ts", import.meta.url)),
  "utf8",
);

describe("skills and title knowledge graph", () => {
  it("creates canonical concepts, aliases, edges, and job mappings", () => {
    for (const table of [
      "knowledge_skills",
      "knowledge_skill_aliases",
      "knowledge_titles",
      "knowledge_title_aliases",
      "knowledge_title_skills",
      "job_knowledge_titles",
      "job_knowledge_skills",
    ]) {
      expect(migration).toContain(`CREATE TABLE public.${table}`);
    }
  });

  it("keeps enrichment bounded and service-role only", () => {
    expect(migration).toContain("LEAST(GREATEST(p_limit, 1), 1000)");
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
    expect(migration).toContain(
      "FROM PUBLIC, anon, authenticated;\nGRANT EXECUTE ON FUNCTION public.process_job_knowledge_queue(INTEGER) TO service_role",
    );
  });

  it("queues job changes and drains a bounded batch after ingestion", () => {
    expect(migration).toContain("AFTER INSERT OR UPDATE OF title, skills");
    expect(ingestion).toContain('"process_job_knowledge_queue"');
    expect(ingestion).toContain("{ p_limit: 500 }");
  });
});
