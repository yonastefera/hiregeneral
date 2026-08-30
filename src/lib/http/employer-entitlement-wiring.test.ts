import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)),
    "utf8",
  );
}

describe("employer entitlement route wiring", () => {
  it.each([
    "app/api/employers/jobs/route.ts",
    "app/api/employers/database/route.ts",
    "app/api/employers/invite/route.ts",
    "app/api/employers/messages/route.ts",
  ])("loads server entitlements in %s", (route) => {
    const contents = source(route);
    expect(contents).toContain("loadEmployerEntitlements(");
    expect(contents).toContain("entitlementDenied(");
  });

  it("enforces active jobs and boost credits before job mutation", () => {
    const contents = source("app/api/employers/jobs/route.ts");
    expect(contents).toContain(
      "entitlements.activeJobs >= entitlements.activeJobLimit",
    );
    expect(contents).toContain("entitlements.boostCredits < 1");
    expect(contents).toContain('z.enum(["none", "3", "5", "10", "20"])');
  });

  it("enforces candidate, invitation, and messaging capabilities", () => {
    expect(source("app/api/employers/database/route.ts")).toContain(
      "entitlements.candidateDatabase",
    );
    expect(source("app/api/employers/invite/route.ts")).toContain(
      "entitlements.invitationsUsed >= entitlements.invitationLimit",
    );
    expect(source("app/api/employers/messages/route.ts")).toContain(
      "entitlements.messagesUsed >= entitlements.messageLimit",
    );
  });

  it("only renders premium analytics from the server entitlement", () => {
    expect(
      source("employer/dashboard/overview/employer-dashboard-data.ts"),
    ).toContain("premiumAnalytics: entitlements.premiumAnalytics");
    expect(
      source("employer/dashboard/overview/DashboardOverviewPage.tsx"),
    ).toContain("premiumAnalytics={data.premiumAnalytics}");
  });
});
