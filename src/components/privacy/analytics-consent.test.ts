import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const layout = fs.readFileSync(path.resolve("src/app/layout.tsx"), "utf8");
const consent = fs.readFileSync(
  path.resolve("src/components/privacy/AnalyticsConsent.tsx"),
  "utf8",
);

describe("analytics consent wiring", () => {
  it("does not mount optional analytics directly from the root layout", () => {
    expect(layout).toContain("<AnalyticsConsent");
    expect(layout).not.toContain("<GoogleAnalytics");
    expect(layout).not.toContain("<MicrosoftClarity");
  });

  it("loads optional providers only after explicit acceptance", () => {
    expect(consent).toContain('consent === "accepted"');
    expect(consent).toContain("Accept analytics");
    expect(consent).toContain("Essential only");
    expect(consent).toContain("Privacy choices");
  });
});
