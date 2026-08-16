import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const authPage = readFileSync(
  resolve(process.cwd(), "src/components/auth/AuthPage.tsx"),
  "utf8",
);

describe("authenticated client navigation", () => {
  it("refreshes server components after password sign-in", () => {
    expect(authPage).toContain("router.replace(target);");
    expect(authPage).toMatch(
      /router\.replace\(target\);\s*router\.refresh\(\);/,
    );
  });
});
