import { afterEach, describe, expect, it } from "vitest";

import {
  normalizePublicRole,
  safeInternalPath,
  safeNextForRole,
  trustedOrigin,
} from "@/lib/auth/security";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
});

describe("auth security", () => {
  it("never accepts admin as a public role", () => {
    expect(normalizePublicRole("admin")).toBeNull();
    expect(normalizePublicRole("recruiter")).toBe("recruiter");
    expect(normalizePublicRole("job_seeker")).toBe("job_seeker");
  });

  it.each([
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%5cevil.test",
    "/%2f%2fevil.test",
    "/jobs%0d%0aLocation:evil",
    "/ok\nLocation: bad",
  ])("rejects unsafe redirect %s", (value) =>
    expect(safeInternalPath(value)).toBeNull(),
  );

  it("keeps safe paths and restricts role-specific destinations", () => {
    expect(safeInternalPath("/jobs?q=engineer#top")).toBe(
      "/jobs?q=engineer#top",
    );
    expect(safeNextForRole("/admin/dashboard", "job_seeker")).toBeNull();
    expect(safeNextForRole("/employers/dashboard", "job_seeker")).toBeNull();
    expect(safeNextForRole("/employers/dashboard", "recruiter")).toBe(
      "/employers/dashboard",
    );
  });

  it("uses the configured origin instead of an untrusted request host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.hiregeneral.com/path";
    expect(trustedOrigin("https://attacker.test")).toBe(
      "https://www.hiregeneral.com",
    );
  });

  it("prefers the canonical app URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.hiregeneral.com";
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.hiregeneral.com";
    expect(trustedOrigin("https://attacker.test")).toBe(
      "https://app.hiregeneral.com",
    );
  });
});
