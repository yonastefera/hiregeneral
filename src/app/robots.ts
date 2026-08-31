import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/jobs", "/jobs/"],
      disallow: [
        "/api/",
        "/admin",
        "/admin-control-center",
        "/auth/",
        "/employers/dashboard",
        "/job-seeker/dashboard",
        "/jobs/*/apply",
        "/account/",
        "/applications",
        "/forgot-password",
        "/messages",
        "/profile",
        "/reset-password",
        "/saved",
        "/saved-jobs",
        "/settings/",
        "/signin",
        "/signup",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
