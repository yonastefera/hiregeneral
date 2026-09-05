import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  fileURLToPath(
    new URL(
      "../migrations/20260905120000_lightweight_job_sitemap.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);
const sitemap = readFileSync(
  fileURLToPath(new URL("../../app/sitemap.ts", import.meta.url)),
  "utf8",
);

describe("lightweight job sitemap", () => {
  it("returns only canonical job identity and modification fields", () => {
    expect(migration).toContain("'id', job.id");
    expect(migration).toContain("'slug', job.slug");
    expect(migration).toContain("'updated_at', job.updated_at");
    expect(migration).not.toContain("description");
  });

  it("bounds one sitemap below the protocol URL limit", () => {
    expect(migration).toContain("49990");
    expect(migration).toContain("LEAST(GREATEST(");
    expect(sitemap).toContain("MAX_SITEMAP_URLS = 50_000");
  });

  it("uses an indexed, cached daily database projection", () => {
    expect(migration).toContain("jobs_sitemap_published_updated_idx");
    expect(sitemap).toContain('.rpc("get_public_job_sitemap"');
    expect(sitemap).toContain('["public-job-sitemap-v1"]');
    expect(sitemap).toContain("revalidate = 86400");
    expect(sitemap).not.toContain('.from("jobs")');
  });

  it("does not cache transient database failures as an empty sitemap", () => {
    const loader = sitemap.slice(
      sitemap.indexOf("const loadSitemapJobs"),
      sitemap.indexOf("export default async function sitemap"),
    );

    expect(loader).toContain("throw new Error(error.message)");
    expect(loader).not.toContain("catch");
  });

  it("keeps database execution grants explicit", () => {
    expect(migration).toContain("FROM PUBLIC;");
    expect(migration).toContain("TO anon, authenticated, service_role;");
    expect(migration).not.toContain("SECURITY DEFINER");
  });
});
