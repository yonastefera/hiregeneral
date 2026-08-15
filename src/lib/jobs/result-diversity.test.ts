import { describe, expect, it } from "vitest";

import {
  dedupeJobListings,
  diversifyJobListings,
} from "@/lib/jobs/result-diversity";

const job = (
  id: string,
  company_name: string,
  title: string,
  location = "New York, NY",
) => ({ id, company_name, title, location });

describe("job result diversity", () => {
  it("removes duplicate ids and normalized duplicate listings", () => {
    const rows = dedupeJobListings([
      job("1", "Acme", "Engineer"),
      job("1", "Acme", "Engineer"),
      job("2", " acme ", "  ENGINEER "),
      job("3", "Acme", "Engineer", "Boston, MA"),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["1", "3"]);
  });

  it("round-robins companies while preserving each company's input order", () => {
    const rows = diversifyJobListings([
      job("a1", "Acme", "Newest"),
      job("a2", "Acme", "Older"),
      job("b1", "Bravo", "Newest"),
      job("c1", "Cyan", "Newest"),
      job("b2", "Bravo", "Older"),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["a1", "b1", "c1", "a2", "b2"]);
  });
});
