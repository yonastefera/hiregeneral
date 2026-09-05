import { describe, expect, it } from "vitest";

import { limitJobListingsPerCompany } from "./result-diversity";

function listing(id: string, company_name: string) {
  return { id, company_name, title: `Role ${id}`, location: "Remote" };
}

describe("job result diversity", () => {
  it("limits repeated companies and rotates companies through the page", () => {
    const rows = [
      listing("1", "Acme"),
      listing("2", "Acme"),
      listing("3", "Acme"),
      listing("4", "Beta"),
      listing("5", "Beta"),
      listing("6", "Gamma"),
    ];

    const result = limitJobListingsPerCompany(rows, 2);

    expect(result.map((row) => row.company_name)).toEqual([
      "Acme",
      "Beta",
      "Gamma",
      "Acme",
      "Beta",
    ]);
  });

  it("treats casing and extra whitespace as the same company", () => {
    const rows = [
      listing("1", "Acme Corp"),
      listing("2", " acme   corp "),
      listing("3", "ACME CORP"),
    ];

    expect(limitJobListingsPerCompany(rows, 2)).toHaveLength(2);
  });
});
