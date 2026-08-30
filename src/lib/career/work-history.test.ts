import { describe, expect, it } from "vitest";

import { analyzeRecordedWorkHistory } from "./work-history";

describe("recorded work history analysis", () => {
  it("finds time between non-overlapping recorded roles", () => {
    const result = analyzeRecordedWorkHistory([
      { start_date: "2020-01-01", end_date: "2021-01-01" },
      { start_date: "2021-05-01", end_date: "2022-01-01" },
    ]);
    expect(result.roleCount).toBe(2);
    expect(result.gaps).toHaveLength(1);
    expect(result.gaps[0].months).toBe(4);
  });

  it("merges overlapping roles and ignores short transitions", () => {
    const result = analyzeRecordedWorkHistory([
      { start_date: "2020-01-01", end_date: "2021-06-01" },
      { start_date: "2021-01-01", end_date: "2022-01-01" },
      { start_date: "2022-02-01", end_date: "2023-01-01" },
    ]);
    expect(result.gaps).toEqual([]);
  });

  it("handles current, invalid, and missing history safely", () => {
    expect(analyzeRecordedWorkHistory(null).roleCount).toBe(0);
    const result = analyzeRecordedWorkHistory(
      [
        { start_date: "bad", end_date: "2021-01-01" },
        { start_date: "2022-01-01", is_current: true },
      ],
      new Date("2026-01-01"),
    );
    expect(result.roleCount).toBe(1);
  });
});
