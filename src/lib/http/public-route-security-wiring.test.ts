import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)),
    "utf8",
  );
}

const publicSearchRoutes = [
  "app/api/keyword-suggestions/route.ts",
  "app/api/locations/route.ts",
  "app/api/locations/reverse/route.ts",
  "app/api/salaries/route.ts",
  "app/api/schools/route.ts",
  "app/api/jobs/route.ts",
  "app/api/jobs/[slug]/route.ts",
];

describe("public API security wiring", () => {
  it.each(publicSearchRoutes)("validates and rate-limits %s", (route) => {
    const routeSource = source(route);
    expect(routeSource).toContain("safeParse(");
    expect(routeSource).toContain("enforceRateLimit({");
  });

  it.each(publicSearchRoutes)("sets cache rules for %s", (route) => {
    expect(source(route)).toContain("Cache-Control");
  });

  it("times out reverse-geocoding and hides provider details", () => {
    const route = source("app/api/locations/reverse/route.ts");
    expect(route).toContain("AbortSignal.timeout(5_000)");
    expect(route).not.toContain("body.error_message ??");
    expect(route).not.toContain("Missing GOOGLE_MAPS_API_KEY");
  });

  it("does not expose salary implementation errors", () => {
    const route = source("app/api/salaries/route.ts");
    expect(route).toContain("safeServerError(");
    expect(route).not.toContain("error instanceof Error");
  });
});
