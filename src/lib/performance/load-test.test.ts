import { describe, expect, it } from "vitest";

import {
  assertSafeLoadTarget,
  percentile,
  summarizeLoad,
  thresholdsPassed,
} from "./load-test";

describe("load-test safety and reporting", () => {
  it("calculates nearest-rank percentiles and error rates", () => {
    expect(percentile([50, 10, 40, 20, 30], 0.5)).toBe(30);
    expect(
      summarizeLoad([
        { durationMs: 100, ok: true, route: "/", status: 200 },
        { durationMs: 300, ok: false, route: "/", status: 500 },
      ]),
    ).toEqual({
      requests: 2,
      failed: 1,
      errorRate: 0.5,
      p50Ms: 100,
      p95Ms: 300,
    });
  });

  it("requires confirmation locally because a local app can use a production database", () => {
    expect(() => assertSafeLoadTarget("http://127.0.0.1:3000")).toThrow(
      /app and its database/i,
    );
    expect(
      assertSafeLoadTarget("http://127.0.0.1:3000", {
        confirmNonProduction: true,
      }).hostname,
    ).toBe("127.0.0.1");
    expect(() => assertSafeLoadTarget("https://hiregeneral.com")).toThrow(
      /production/i,
    );
    expect(() => assertSafeLoadTarget("https://preview.example.com")).toThrow(
      /confirmation/i,
    );
  });

  it("requires both remote acknowledgements and enforces thresholds", () => {
    expect(
      assertSafeLoadTarget("https://preview.example.com", {
        allowRemote: true,
        confirmNonProduction: true,
      }).hostname,
    ).toBe("preview.example.com");
    expect(
      thresholdsPassed(
        { requests: 100, failed: 5, errorRate: 0.05, p50Ms: 200, p95Ms: 1500 },
        { maxErrorRate: 0.05, maxP95Ms: 1500 },
      ),
    ).toBe(true);
  });
});
