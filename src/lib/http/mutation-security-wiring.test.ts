import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)),
    "utf8",
  );
}

const boundedJsonRoutes = [
  "app/api/applications/route.ts",
  "app/api/contact/route.ts",
  "app/api/auth/password-update/route.ts",
  "app/api/employers/company/route.ts",
  "app/api/employers/invite/route.ts",
  "app/api/employers/jobs/route.ts",
  "app/api/employers/messages/route.ts",
  "app/api/employers/billing/create-checkout-session/route.ts",
  "app/api/notification-settings/route.ts",
  "app/api/saved/route.ts",
];

const rateLimitedRoutes = [
  "app/api/contact/route.ts",
  "app/api/auth/password-update/route.ts",
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
});
