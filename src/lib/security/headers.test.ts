import { describe, expect, it } from "vitest";

import {
  contentSecurityPolicy,
  phaseTwoSecurityHeaders,
} from "@/lib/security/headers";

describe("Phase 2 security headers", () => {
  it("starts CSP in report-only mode", () => {
    const headers = phaseTwoSecurityHeaders({
      nodeEnv: "production",
      enforceCsp: false,
    });

    expect(headers).toContainEqual(
      expect.objectContaining({
        key: "Content-Security-Policy-Report-Only",
      }),
    );
  });

  it("supports explicit CSP enforcement", () => {
    const headers = phaseTwoSecurityHeaders({
      nodeEnv: "production",
      enforceCsp: true,
    });

    expect(headers).toContainEqual(
      expect.objectContaining({ key: "Content-Security-Policy" }),
    );
  });

  it("adds HSTS only in production", () => {
    expect(
      phaseTwoSecurityHeaders({ nodeEnv: "production" }).some(
        (header) => header.key === "Strict-Transport-Security",
      ),
    ).toBe(true);
    expect(
      phaseTwoSecurityHeaders({ nodeEnv: "development" }).some(
        (header) => header.key === "Strict-Transport-Security",
      ),
    ).toBe(false);
  });

  it("blocks objects and limits sensitive browser capabilities", () => {
    const policy = contentSecurityPolicy("production");

    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("'unsafe-eval'");
  });
});
