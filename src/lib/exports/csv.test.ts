import { describe, expect, it } from "vitest";

import { csvCell, rowsToCsv } from "./csv";

describe("CSV exports", () => {
  it("escapes quotes and commas", () => {
    expect(csvCell('Doe, "Jane"')).toBe('"Doe, ""Jane"""');
  });

  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1)", "\tpayload", "\rpayload"])(
    "neutralizes spreadsheet formulas in %s",
    (value) => expect(csvCell(value)).toBe(`"'${value}"`),
  );

  it("creates CRLF-delimited rows", () => {
    expect(rowsToCsv(["Name", "Count"], [["Jane", 2]])).toBe(
      '"Name","Count"\r\n"Jane","2"',
    );
  });
});
