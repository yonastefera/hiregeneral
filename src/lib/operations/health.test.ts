import { describe, expect, it } from "vitest";

import { ageInHours, freshnessCheck, overallHealth } from "./health";

describe("operational health", () => {
  const now = new Date("2026-08-30T12:00:00.000Z");

  it("calculates bounded event age", () => {
    expect(ageInHours("2026-08-30T06:00:00.000Z", now)).toBe(6);
    expect(ageInHours("invalid", now)).toBeNull();
    expect(ageInHours("2026-08-31T00:00:00.000Z", now)).toBe(0);
  });

  it("degrades stale and missing freshness signals", () => {
    expect(
      freshnessCheck({
        name: "Ingestion",
        latestAt: "2026-08-30T00:00:00.000Z",
        now,
        thresholdHours: 24,
        missingSummary: "Missing",
      }).status,
    ).toBe("healthy");
    expect(
      freshnessCheck({
        name: "Ingestion",
        latestAt: null,
        now,
        thresholdHours: 24,
        missingSummary: "Missing",
      }).status,
    ).toBe("degraded");
  });

  it("uses the most severe component status", () => {
    expect(
      overallHealth([
        { name: "A", status: "healthy", summary: "ok" },
        { name: "B", status: "degraded", summary: "slow" },
      ]),
    ).toBe("degraded");
    expect(
      overallHealth([
        { name: "A", status: "degraded", summary: "slow" },
        { name: "B", status: "unavailable", summary: "down" },
      ]),
    ).toBe("unavailable");
  });
});
