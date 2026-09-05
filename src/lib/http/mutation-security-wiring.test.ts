import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)),
    "utf8",
  );
}

const apiRoot = fileURLToPath(new URL("../../app/api", import.meta.url));

function routeFiles(directory = apiRoot): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

const boundedJsonRoutes = [
  "app/api/applications/route.ts",
  "app/api/contact/route.ts",
  "app/api/auth/password-update/route.ts",
  "app/api/auth/otp/request/route.ts",
  "app/api/auth/otp/verify/route.ts",
  "app/api/employers/company/route.ts",
  "app/api/employers/invite/route.ts",
  "app/api/employers/jobs/route.ts",
  "app/api/employers/messages/route.ts",
  "app/api/employers/billing/create-checkout-session/route.ts",
  "app/api/notification-settings/route.ts",
  "app/api/saved/route.ts",
  "app/api/messages/route.ts",
];

const rateLimitedRoutes = [
  "app/api/contact/route.ts",
  "app/api/auth/password-update/route.ts",
  "app/api/auth/otp/request/route.ts",
  "app/api/auth/otp/verify/route.ts",
  "app/api/admin/seed-schools/route.ts",
  "app/api/employers/company/route.ts",
  "app/api/employers/invite/route.ts",
  "app/api/employers/jobs/route.ts",
  "app/api/employers/messages/route.ts",
  "app/api/employers/billing/create-checkout-session/route.ts",
  "app/api/employers/billing/create-portal-session/route.ts",
  "app/api/ingest/jobs/route.ts",
  "app/api/notification-settings/route.ts",
  "app/api/saved/route.ts",
  "app/api/messages/route.ts",
  "app/api/account/deletion/route.ts",
];

describe("high-risk mutation security wiring", () => {
  it.each(boundedJsonRoutes)("bounds JSON input for %s", (route) => {
    expect(source(route)).toContain("boundedJsonBody(");
  });

  it.each(rateLimitedRoutes)("enforces a rate limit for %s", (route) => {
    expect(source(route)).toContain("enforceRateLimit({");
  });

  it("bounds Stripe webhook payloads and hides verification details", () => {
    const route = source("app/api/webhooks/stripe/route.ts");

    expect(route).toContain("boundedTextBody(");
    expect(route).toContain('error: "Could not process Stripe webhook."');
    expect(route).not.toContain("error instanceof Error");
  });

  it.each([
    "app/api/contact/route.ts",
    "app/api/auth/signup/route.ts",
    "app/api/auth/password-reset/route.ts",
    "app/api/auth/otp/request/route.ts",
    "app/api/employers/invite/route.ts",
    "app/api/employers/messages/route.ts",
    "app/api/messages/route.ts",
  ])("rejects duplicate abuse for %s", (route) => {
    expect(source(route)).toContain("enforceDuplicateCooldown({");
  });

  it.each(boundedJsonRoutes)(
    "does not bypass bounded parsing in %s",
    (route) => {
      expect(source(route)).not.toMatch(/(?:request|req)\.json\(/);
    },
  );

  it("routes all API logging through redaction helpers", () => {
    for (const route of routeFiles()) {
      expect(readFileSync(route, "utf8"), route).not.toMatch(
        /console\.(?:error|warn|info|log)\(/,
      );
    }
  });

  it.each(["app/api/jobs/route.ts", "app/api/salaries/route.ts"])(
    "uses anonymous rather than service-role access for %s",
    (route) => {
      const routeSource = source(route);
      expect(routeSource).toContain("createSupabasePublicClient");
      expect(routeSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    },
  );

  it("keeps shared public job-detail loading on anonymous access", () => {
    const routeSource = source("app/api/jobs/[slug]/route.ts");
    const loaderSource = source("lib/jobs/public-job-detail.ts");

    expect(routeSource).toContain("loadPublicJobDetail");
    expect(loaderSource).toContain("createSupabasePublicClient");
    expect(loaderSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
