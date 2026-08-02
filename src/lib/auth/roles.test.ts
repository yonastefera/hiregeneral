import { describe, expect, it } from "vitest";

import { routeForRole } from "@/lib/auth/roles";

describe("role routing", () => {
  it.each([
    ["job_seeker", "/job-seeker/dashboard"],
    ["recruiter", "/employers/dashboard"],
    ["admin", "/admin/dashboard"],
  ] as const)("routes %s to %s", (role, route) => {
    expect(routeForRole(role)).toBe(route);
  });
});
