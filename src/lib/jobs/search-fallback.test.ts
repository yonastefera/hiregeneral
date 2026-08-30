import { describe, expect, it } from "vitest";

import { shouldUseDirectJobsFallback } from "@/lib/jobs/search-fallback";

describe("public job search fallback", () => {
  it.each(["57014", "PGRST202", "42883"])(
    "uses direct search for recoverable database code %s",
    (code) => {
      expect(shouldUseDirectJobsFallback({ code })).toBe(true);
    },
  );

  it("uses direct search when PostgREST identifies the missing RPC by name", () => {
    for (const functionName of [
      "search_jobs_public",
      "search_jobs_knowledge_public",
    ]) {
      expect(
        shouldUseDirectJobsFallback({
          message: `Could not find public.${functionName} in the schema cache`,
        }),
      ).toBe(true);
    }
  });

  it("does not hide unrelated database failures", () => {
    expect(shouldUseDirectJobsFallback({ code: "42501" })).toBe(false);
    expect(shouldUseDirectJobsFallback(new Error("connection failed"))).toBe(
      false,
    );
  });
});
