import { describe, expect, it } from "vitest";

import { privacyPolicyContent } from "@/legal/legal-content";

const policyText = [
  privacyPolicyContent.description,
  ...privacyPolicyContent.sections.flatMap((section) => [
    section.title,
    ...(section.body ?? []),
    ...(section.bullets ?? []),
  ]),
].join("\n");

describe("public privacy policy controls", () => {
  it.each([
    "14-day grace period",
    "download a JSON export",
    "short-lived, server-authorized links",
    "contact submissions for up to 12 months",
    "read notifications for up to 180 days",
    "up to 24 months",
    "rotating backup window",
    "Active employer subscriptions are cancelled",
  ])("discloses %s", (disclosure) => {
    expect(policyText).toContain(disclosure);
  });

  it("excludes demographic responses from employer and decision systems", () => {
    expect(policyText).toContain(
      "gender, ethnicity, veteran-status, and disability-status",
    );
    expect(policyText).toContain(
      "not provided through employer candidate lists",
    );
    expect(policyText).toContain("not used for candidate search, ranking");
  });

  it("does not present placeholder or sample policy copy", () => {
    expect(policyText).not.toMatch(/\b(?:placeholder|sample)\b/i);
  });
});
