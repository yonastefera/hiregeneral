import { afterEach, describe, expect, it } from "vitest";

import robots from "./robots";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("robots", () => {
  it("advertises the canonical sitemap and protects private routes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.hiregeneral.com";

    const result = robots();

    expect(result.sitemap).toBe("https://www.hiregeneral.com/sitemap.xml");
    expect(result.host).toBe("https://www.hiregeneral.com");
    expect(result.rules).toEqual(
      expect.objectContaining({
        allow: ["/", "/jobs", "/jobs/"],
        disallow: expect.arrayContaining([
          "/api/",
          "/admin",
          "/employers/dashboard",
          "/job-seeker/dashboard",
          "/jobs/*/apply",
          "/signin",
        ]),
      }),
    );
  });
});
