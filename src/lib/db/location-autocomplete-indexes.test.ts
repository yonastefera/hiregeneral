import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/lib/migrations/20260815163000_optimize_location_autocomplete.sql",
  ),
  "utf8",
);

describe("location autocomplete query indexes", () => {
  it("matches indexes to the normalized city, state, and ZIP predicates", () => {
    expect(migration).toContain("lower(city) gin_trgm_ops");
    expect(migration).toContain("ON public.locations (lower(state))");
    expect(migration).toContain("zip_code text_pattern_ops");
  });

  it("canonicalizes the bounded search function", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.search_locations(search_query text)",
    );
    expect(migration).toContain("ROWS 8");
    expect(migration).toContain("LIMIT 8;");
  });
});
