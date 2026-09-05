import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

describe("public traffic cost controls", () => {
  it("serves cached job searches before invoking the rate-limit service", () => {
    const route = source("../../app/api/jobs/route.ts");
    const cacheRead = route.lastIndexOf("await readJobsCache(cacheKey)");
    const rateLimit = route.lastIndexOf("await enforceRateLimit({");

    expect(cacheRead).toBeGreaterThan(-1);
    expect(rateLimit).toBeGreaterThan(cacheRead);
  });

  it("uses paginated database search for normal browsing", () => {
    const route = source("../../app/api/jobs/route.ts");
    const defaultBrowse = route.slice(
      route.indexOf("if (!query.trim() && !easyApply)"),
      route.indexOf("} else if (easyApply)"),
    );

    expect(defaultBrowse).toContain("searchJobsPaginated");
    expect(defaultBrowse).not.toContain("searchJobsDirect");
  });

  it("bypasses authentication work for anonymous public pages", () => {
    const proxy = source("../../proxy.ts");
    const publicBypass = proxy.indexOf(
      "if (!requiresAuth && !isAuthRoute && !hasAuthCookie)",
    );
    const authLookup = proxy.indexOf("await supabase.auth.getUser()");

    expect(publicBypass).toBeGreaterThan(-1);
    expect(authLookup).toBeGreaterThan(publicBypass);
  });
});
