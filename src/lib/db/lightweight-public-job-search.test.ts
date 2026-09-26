import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260905100000_lightweight_public_job_search.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const route = readFileSync(
  fileURLToPath(new URL("../../app/api/jobs/route.ts", import.meta.url)),
  "utf8",
);
const marketCategoryMigration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260925201500_align_market_category_search.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("lightweight public job search", () => {
  it("projects bounded card fields instead of complete job rows", () => {
    expect(migration).toContain("jsonb_build_object(");
    expect(migration).toContain("'description', left(");
    expect(migration).toContain("480");
    expect(migration).not.toContain("to_jsonb(ranked)");
    expect(migration).not.toContain("'responsibilities'");
    expect(migration).not.toContain("'requirements'");
    expect(migration).not.toContain("'benefits'");
    expect(migration).toContain("'enrichment', CASE");
    expect(migration).toContain("enrichment.status = 'ready'");
  });

  it("filters Easy Apply before counting and pagination", () => {
    const filterPosition = migration.indexOf(
      "NOT COALESCE(p_easy_apply, false)",
    );
    const paginationPosition = migration.indexOf("ranked.retrieval_rank >");

    expect(filterPosition).toBeGreaterThan(-1);
    expect(paginationPosition).toBeGreaterThan(filterPosition);
    expect(migration).toContain("jobs_easy_apply_published_posted_idx");
  });

  it("is the only search RPC used by the API", () => {
    expect(route).toContain('rpc("search_job_cards_public"');
    expect(route).not.toContain('rpc("search_jobs_public"');
    expect(route).not.toContain('"search_jobs_knowledge_public"');
    expect(route).not.toContain("EASY_APPLY_MAX_SCAN_PAGES");
  });

  it("keeps public read access explicit and constrained", () => {
    expect(migration).toContain("FROM PUBLIC;");
    expect(migration).toContain("TO anon, authenticated;");
    expect(migration).not.toContain("SECURITY DEFINER");
  });

  it("keeps market-card searches aligned with homepage category terms", () => {
    expect(marketCategoryMigration).toContain("WHEN 'market:design'");
    expect(marketCategoryMigration).toContain(
      "'designer', 'design', 'ux', 'ui', 'user experience', 'creative'",
    );
    expect(marketCategoryMigration).toContain(
      "CASE WHEN p_balance = 'company' THEN company_rank ELSE 1 END",
    );
    expect(marketCategoryMigration).not.toContain("company_rank <= 3");
  });
});
