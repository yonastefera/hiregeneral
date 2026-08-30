import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const srcRoot = fileURLToPath(new URL("../../", import.meta.url));
const apiRoot = join(srcRoot, "app/api");

function mutationRoutes(directory = apiRoot): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return mutationRoutes(path);
    if (entry.name !== "route.ts") return [];

    return /export async function (?:POST|PUT|PATCH|DELETE)\b/.test(
      readFileSync(path, "utf8"),
    )
      ? [relative(srcRoot, path)]
      : [];
  });
}

const behavioralCoverage: Record<string, string> = {
  "app/api/account/deletion/route.ts": "app/api/account/deletion/route.test.ts",
  "app/api/account/employer-access/route.ts":
    "app/api/account/employer-access/route.test.ts",
  "app/api/admin/seed-schools/route.ts":
    "app/api/admin/seed-schools/route.test.ts",
  "app/api/applications/route.ts": "app/api/applications/route.test.ts",
  "app/api/auth/password-reset/route.ts": "app/api/auth/auth-routes.test.ts",
  "app/api/auth/password-update/route.ts":
    "app/api/auth/password-update/route.test.ts",
  "app/api/auth/otp/request/route.ts": "app/api/auth/otp/otp-routes.test.ts",
  "app/api/auth/otp/verify/route.ts": "app/api/auth/otp/otp-routes.test.ts",
  "app/api/auth/role/route.ts": "app/api/auth/role-route.test.ts",
  "app/api/auth/signout/route.ts": "app/api/auth/signout/route.test.ts",
  "app/api/auth/signup/route.ts": "app/api/auth/auth-routes.test.ts",
  "app/api/contact/route.ts": "app/api/contact/route.test.ts",
  "app/api/employers/billing/create-checkout-session/route.ts":
    "app/api/employers/billing/billing-session-security.test.ts",
  "app/api/employers/billing/create-portal-session/route.ts":
    "app/api/employers/billing/billing-session-security.test.ts",
  "app/api/employers/company/route.ts":
    "app/api/employers/company/route.test.ts",
  "app/api/employers/invite/route.ts": "app/api/employers/invite/route.test.ts",
  "app/api/employers/jobs/route.ts": "app/api/employers/jobs/route.test.ts",
  "app/api/employers/messages/route.ts":
    "app/api/employers/messages/route.test.ts",
  "app/api/ingest/jobs/route.ts": "app/api/ingest/jobs/route.test.ts",
  "app/api/internal/account-deletions/route.ts":
    "app/api/internal/account-deletions/route.test.ts",
  "app/api/messages/route.ts": "app/api/messages/route.test.ts",
  "app/api/notification-settings/route.ts":
    "app/api/notification-settings/route.test.ts",
  "app/api/saved-searches/[id]/route.ts":
    "app/api/saved-searches/route.test.ts",
  "app/api/saved-searches/route.ts": "app/api/saved-searches/route.test.ts",
  "app/api/saved/route.ts": "app/api/saved/route.test.ts",
  "app/api/webhooks/stripe/route.ts": "app/api/webhooks/stripe/route.test.ts",
};

describe("mutation behavioral coverage", () => {
  it("requires every mutation route to declare a behavioral test", () => {
    expect(mutationRoutes().sort()).toEqual(
      Object.keys(behavioralCoverage).sort(),
    );
  });

  it.each(Object.entries(behavioralCoverage))(
    "%s is covered by %s",
    (_route, testFile) => {
      expect(existsSync(join(srcRoot, testFile))).toBe(true);
    },
  );
});
